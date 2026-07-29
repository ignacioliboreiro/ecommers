"use server";

import { getPaymentProvider } from "@/lib/payments";
import { prisma } from "@/lib/prisma";

import { requireAdmin } from "./require-admin";

export interface PaymentStatusCheck {
  ok: boolean;
  /** Texto listo para mostrar en el panel. */
  message: string;
  /** true si el estado del proveedor no coincide con el de la orden. */
  mismatch: boolean;
}

const STATUS_BY_PAYMENT: Record<string, string[]> = {
  approved: ["PAID", "FULFILLED"],
  rejected: ["CANCELLED", "EXPIRED", "REFUNDED"],
  pending: ["PENDING_PAYMENT", "PROCESSING"],
};

/**
 * Consulta al proveedor el estado real de un pago y lo compara con el estado de
 * la orden.
 *
 * Para qué sirve: los webhooks se pierden. Si un webhook nunca llegó, la orden
 * queda PENDING_PAYMENT mientras el proveedor ya cobró. Esto permite detectarlo
 * desde el panel sin entrar al dashboard del proveedor.
 *
 * Deliberadamente **solo lee**: no corrige la orden. Aplicar el estado del
 * proveedor implicaría mover stock, vaciar carrito y mandar email — o sea,
 * duplicar `processPaymentEvent` desde un botón. Si hace falta corregir, el
 * cambio manual de estado ya existe y queda auditado en `OrderStatusChange`.
 */
export async function checkPaymentStatus(orderId: string): Promise<PaymentStatusCheck> {
  await requireAdmin();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, paymentProvider: true, paymentRef: true },
  });

  if (!order) {
    return { ok: false, message: "Pedido no encontrado.", mismatch: false };
  }

  if (!order.paymentRef) {
    return {
      ok: false,
      message: "El pedido todavía no tiene una referencia de pago del proveedor.",
      mismatch: false,
    };
  }

  try {
    // Se resuelve por el proveedor de la orden, no por STORE_MODE: una orden
    // vieja tiene que consultarse donde realmente se cobró.
    const provider = getPaymentProvider(order.paymentProvider);
    const status = await provider.getPaymentStatus(order.paymentRef);

    const expected = STATUS_BY_PAYMENT[status.status] ?? [];
    const mismatch = !expected.includes(order.status);

    const detail =
      `Proveedor: ${order.paymentProvider} · estado "${status.status}" ` +
      `(crudo: ${status.rawStatus})` +
      (provider.isReal ? "" : " · pago simulado");

    return {
      ok: true,
      mismatch,
      message: mismatch
        ? `⚠️ Discrepancia — el pedido está en ${order.status} pero el pago figura como "${status.status}". ${detail}`
        : `Coincide con el estado del pedido (${order.status}). ${detail}`,
    };
  } catch (err) {
    console.error(`[admin] No se pudo consultar el pago de la orden ${orderId}:`, err);
    return {
      ok: false,
      mismatch: false,
      message:
        err instanceof Error
          ? `No se pudo consultar el proveedor: ${err.message}`
          : "No se pudo consultar el proveedor.",
    };
  }
}
