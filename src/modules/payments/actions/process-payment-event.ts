import "server-only";

import { Prisma, type OrderStatus } from "@prisma/client";
import { Resend } from "resend";

import type { PaymentEvent } from "@/lib/payments/types";
import { prisma } from "@/lib/prisma";
import { getShippingProvider } from "@/lib/shipping";

/**
 * Resultado de aplicar un evento de pago. Se devuelve un objeto y no un
 * `Response` porque este código tiene dos callers con formas distintas:
 *
 *   - Los webhooks (`/api/webhooks/*`) necesitan un `Response` HTTP.
 *   - La server action del pago simulado necesita saber qué pasó para redirigir.
 *
 * Que ambos pasen por acá es el punto del diseño: el flujo simulado no tiene su
 * propia lógica de actualización de órdenes. Si la tuviera, una demo podría
 * funcionar mientras el flujo real está roto.
 */
export interface ProcessPaymentEventResult {
  outcome: "applied" | "duplicate" | "order-not-found";
  /** Estado en el que quedó la orden. Ausente si la orden no existe. */
  status?: OrderStatus;
}

/**
 * Aplica un PaymentEvent ya normalizado (Stripe, Mercado Pago o simulado) a la
 * Order correspondiente. Compartido por todos los proveedores porque la lógica
 * de negocio (idempotencia, stock, carrito, envío, email) es idéntica — solo
 * cambia cómo cada proveedor entrega y firma el evento.
 */
export async function processPaymentEvent(
  event: PaymentEvent
): Promise<ProcessPaymentEventResult> {
  const order = await prisma.order.findUnique({
    where: { id: event.orderId },
    include: {
      user: true,
      items: { include: { variant: true } },
    },
  });

  if (!order) {
    return { outcome: "order-not-found" };
  }

  let newStatus: OrderStatus;
  let stockAction: "CONFIRM" | "CANCEL" | null = null;
  let shouldClearCart = false;

  if (event.status === "approved") {
    newStatus = "PAID";
    stockAction = "CONFIRM"; // Las RESERVATION pasan a SALE (el stock ya bajó al reservar).
    shouldClearCart = true;
  } else if (event.status === "rejected") {
    newStatus = "CANCELLED";
    stockAction = "CANCEL"; // Se liberan las RESERVATION y el stock vuelve.
  } else {
    newStatus = "PENDING_PAYMENT";
  }

  const alreadyProcessed = await prisma.$transaction(async (tx) => {
    // Idempotencia: si ya existe un PaymentEvent para (provider, providerRef),
    // este webhook es un reintento/duplicado — no repetir ningún efecto.
    try {
      await tx.paymentEvent.create({
        data: {
          provider: event.provider,
          providerRef: event.providerRef,
          rawType: event.rawType,
          simulated: event.simulated ?? false,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return true;
      }
      throw err;
    }

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: newStatus,
        paymentRef: event.providerRef,
        updatedAt: new Date(),
      },
    });

    const variantIds = order.items.map((item) => item.variantId);

    if (stockAction === "CONFIRM") {
      await tx.stockMovement.updateMany({
        where: { variantId: { in: variantIds }, type: "RESERVATION" },
        data: { type: "SALE" },
      });
    } else if (stockAction === "CANCEL") {
      const reservations = await tx.stockMovement.findMany({
        where: { variantId: { in: variantIds }, type: "RESERVATION" },
      });

      for (const reservation of reservations) {
        await tx.stockMovement.create({
          data: {
            variantId: reservation.variantId,
            type: "ADJUSTMENT",
            quantity: -reservation.quantity, // positivo: se libera lo reservado (negativo)
            note: `Cancellation of reservation for order ${order.id}`,
          },
        });
      }

      await tx.stockMovement.deleteMany({
        where: { variantId: { in: variantIds }, type: "RESERVATION" },
      });

      const quantityByVariant = new Map<string, number>();
      for (const item of order.items) {
        quantityByVariant.set(
          item.variantId,
          (quantityByVariant.get(item.variantId) ?? 0) + item.quantity
        );
      }
      for (const [variantId, quantity] of quantityByVariant) {
        await tx.productVariant.update({
          where: { id: variantId },
          data: { stock: { increment: quantity } },
        });
      }
    }

    if (shouldClearCart) {
      const cartWhere = order.userId
        ? { userId: order.userId }
        : order.guestId
          ? { guestId: order.guestId }
          : null;
      const cart = cartWhere ? await tx.cart.findFirst({ where: cartWhere, select: { id: true } }) : null;
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }
    }

    return false;
  });

  if (alreadyProcessed) {
    console.log(
      `[${event.provider} Webhook] Event ${event.providerRef} ya procesado, ignorando reintento.`
    );
    return { outcome: "duplicate", status: order.status };
  }

  if (newStatus === "PAID") {
    console.log(`[${event.provider} Webhook] Order ${order.id} paid successfully`);

    // Envío y email son best-effort y van *fuera* de la transacción: son efectos
    // externos, y un fallo de cualquiera de los dos no debe revertir un pago ya
    // cobrado ni hacer que el proveedor reintente el webhook.
    await createShipmentForOrder(order.id);
    await sendOrderConfirmationEmail(
      order.id,
      order.contactEmail ?? order.user?.email ?? null,
      order.totalCents
    );
  } else if (newStatus === "CANCELLED") {
    console.log(`[${event.provider} Webhook] Order ${order.id} payment failed/cancelled`);
  }

  return { outcome: "applied", status: newStatus };
}

/** Traduce el resultado a la respuesta HTTP que esperan los webhooks. */
export function paymentEventResultToResponse(result: ProcessPaymentEventResult): Response {
  if (result.outcome === "order-not-found") {
    return new Response("Order not found", { status: 404 });
  }

  return new Response(
    JSON.stringify({ received: true, duplicate: result.outcome === "duplicate" }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}

/**
 * Genera el envío de una orden recién pagada a través del adapter configurado.
 *
 * Best-effort a propósito: si el courier está caído, la orden igual quedó
 * pagada. El pedido queda sin trackingId y se puede regenerar después (la UI
 * muestra "preparando el envío" mientras no haya uno).
 */
async function createShipmentForOrder(orderId: string): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        city: true,
        state: true,
        postalCode: true,
        country: true,
        totalCents: true,
        trackingId: true,
        items: { select: { variantId: true, quantity: true, priceCents: true } },
      },
    });

    if (!order) return;

    // Si ya tiene envío, no generar otro (defensa extra además de la
    // idempotencia del PaymentEvent: generar dos etiquetas cuesta plata real).
    if (order.trackingId) {
      console.log(`[Shipping] Orden ${orderId} ya tiene envío ${order.trackingId}, no se regenera.`);
      return;
    }

    const provider = getShippingProvider();
    const shipment = await provider.createShipment({
      orderId,
      address: {
        city: order.city,
        state: order.state,
        postalCode: order.postalCode,
        country: order.country,
      },
      items: order.items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
        unitPriceCents: item.priceCents,
      })),
      declaredValueCents: order.totalCents,
    });

    await prisma.order.update({
      where: { id: orderId },
      data: {
        shippingProvider: shipment.provider,
        trackingId: shipment.trackingId,
        shipmentCreatedAt: new Date(),
      },
    });

    console.log(
      `[Shipping] Envío generado para orden ${orderId} con ${shipment.provider}: ${shipment.trackingId}`
    );
  } catch (err) {
    console.error(`[Shipping] No se pudo generar el envío de la orden ${orderId}:`, err);
  }
}

async function sendOrderConfirmationEmail(
  orderId: string,
  to: string | null,
  totalCents: number
): Promise<void> {
  if (!to) {
    console.log(`[Email] Orden ${orderId} sin email de contacto, no se envía confirmación.`);
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.warn("[Email] RESEND_API_KEY/EMAIL_FROM no configurados, no se envía confirmación.");
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from,
      to,
      subject: `Confirmación de tu pedido #${orderId}`,
      text: `¡Gracias por tu compra! Tu pedido #${orderId} por un total de $${(totalCents / 100).toFixed(2)} fue confirmado.`,
    });
    if (result.error) {
      console.error(`[Email] Resend rechazó la confirmación de orden ${orderId}:`, result.error);
    } else {
      console.log(`[Email] Confirmación de orden ${orderId} enviada a ${to}, Resend id: ${result.data?.id}`);
    }
  } catch (err) {
    // Un fallo de email no debe hacer fallar el webhook (Stripe/MP reintentarían igual).
    console.error(`[Email] Error enviando confirmación de orden ${orderId}:`, err);
  }
}
