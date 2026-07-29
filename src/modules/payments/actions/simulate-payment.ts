"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { assertDemoMode } from "@/lib/config/store-mode";
import { buildMockWebhookBody, mockPaymentAdapter } from "@/lib/payments/mock-provider";
import type { PaymentEventStatus } from "@/lib/payments/types";
import { prisma } from "@/lib/prisma";
import { readGuestId } from "@/src/modules/cart/actions/guest-cookie";

import { processPaymentEvent } from "./process-payment-event";

/**
 * Simula el resultado de un pago desde la página `/checkout/demo-payment/[id]`.
 *
 * Lo importante de esta función es lo que **no** hace: no actualiza la orden, ni
 * el stock, ni el carrito, ni manda el email. Solo fabrica el payload que
 * mandaría un proveedor real y lo mete por el mismo pipeline
 * (`parseWebhookEvent` → `processPaymentEvent`) que usan los webhooks de Stripe
 * y Mercado Pago. Si el flujo real se rompe, la demo se rompe también — que es
 * exactamente lo que uno quiere de un simulador.
 */
export async function simulatePaymentResult(formData: FormData): Promise<void> {
  // 1. Nunca en producción. Lanza en vez de devolver un booleano para que no
  //    exista la posibilidad de ignorar el resultado del chequeo.
  assertDemoMode("La simulación de pagos");

  const orderId = formData.get("orderId");
  const outcome = formData.get("outcome");

  if (typeof orderId !== "string" || !orderId) {
    throw new Error("Falta orderId.");
  }
  if (outcome !== "approved" && outcome !== "rejected") {
    throw new Error(`Resultado simulado inválido: ${String(outcome)}`);
  }

  // 2. Autorización: solo el dueño de la orden puede resolver su pago. Sin esto,
  //    cualquiera con un orderId podría aprobar (o cancelar, restaurando stock)
  //    la orden de otra persona.
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true, guestId: true, status: true, paymentProvider: true },
  });

  if (!order) {
    throw new Error("Orden no encontrada.");
  }

  const session = await auth();
  const guestId = await readGuestId();

  const isOwner = order.userId
    ? order.userId === session?.user?.id
    : order.guestId
      ? order.guestId === guestId
      : false;

  if (!isOwner) {
    // Mismo criterio que `getOrderForUser`: no se distingue "no es tuya" de
    // "no existe", para no revelar la existencia de órdenes ajenas.
    throw new Error("Orden no encontrada.");
  }

  // 3. Solo órdenes pagadas con el proveedor simulado. Una orden creada cuando la
  //    instalación estaba en producción no puede resolverse con un click.
  if (order.paymentProvider !== "MOCK") {
    throw new Error(
      `La orden ${orderId} se creó con ${order.paymentProvider}, no se puede simular su pago.`
    );
  }

  // 4. Mismo camino que un webhook real, de punta a punta.
  const rawBody = buildMockWebhookBody(orderId, outcome as PaymentEventStatus);
  const event = await mockPaymentAdapter.parseWebhookEvent(rawBody);

  if (!event) {
    throw new Error("El adapter simulado no pudo interpretar el evento.");
  }

  const result = await processPaymentEvent(event);

  if (result.outcome === "order-not-found") {
    throw new Error("Orden no encontrada al aplicar el pago simulado.");
  }

  revalidatePath("/cart");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath(`/checkout/demo-payment/${orderId}`);

  // 5. `redirect` lanza: tiene que ser lo último.
  if (outcome === "approved") {
    redirect(`/order/${orderId}`);
  }

  // Rechazado: se vuelve a la misma página, que ahora muestra el estado
  // cancelado y ofrece volver al carrito (que sigue con los productos).
  redirect(`/checkout/demo-payment/${orderId}`);
}
