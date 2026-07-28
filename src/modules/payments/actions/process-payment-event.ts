import "server-only";

import { Prisma } from "@prisma/client";
import { Resend } from "resend";

import { prisma } from "@/lib/prisma";
import type { PaymentEvent } from "@/src/modules/payments/types/payment-provider";

/**
 * Aplica un PaymentEvent ya normalizado (Stripe o Mercado Pago) a la Order
 * correspondiente. Compartido por ambos webhooks porque la lógica de negocio
 * (idempotencia, stock, carrito, email) es idéntica — solo cambia cómo cada
 * proveedor entrega y firma el evento.
 */
export async function processPaymentEvent(event: PaymentEvent): Promise<Response> {
  const order = await prisma.order.findUnique({
    where: { id: event.orderId },
    include: {
      user: true,
      items: { include: { variant: true } },
    },
  });

  if (!order) {
    return new Response("Order not found", { status: 404 });
  }

  let newStatus: typeof order.status;
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
        data: { provider: event.provider, providerRef: event.providerRef, rawType: event.rawType },
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
    return new Response(JSON.stringify({ received: true, duplicate: true }), { status: 200 });
  }

  if (newStatus === "PAID") {
    console.log(`[${event.provider} Webhook] Order ${order.id} paid successfully`);
    await sendOrderConfirmationEmail(order.id, order.contactEmail ?? order.user?.email ?? null, order.totalCents);
  } else if (newStatus === "CANCELLED") {
    console.log(`[${event.provider} Webhook] Order ${order.id} payment failed/cancelled`);
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
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
    await resend.emails.send({
      from,
      to,
      subject: `Confirmación de tu pedido #${orderId}`,
      text: `¡Gracias por tu compra! Tu pedido #${orderId} por un total de $${(totalCents / 100).toFixed(2)} fue confirmado.`,
    });
  } catch (err) {
    // Un fallo de email no debe hacer fallar el webhook (Stripe/MP reintentarían igual).
    console.error(`[Email] Error enviando confirmación de orden ${orderId}:`, err);
  }
}
