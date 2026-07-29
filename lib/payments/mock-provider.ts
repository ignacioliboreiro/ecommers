import "server-only";

import { prisma } from "@/lib/prisma";

import type {
  PaymentEvent,
  PaymentEventStatus,
  PaymentIntentResult,
  PaymentOrderInput,
  PaymentProvider,
  PaymentStatusResult,
} from "./types";

/**
 * Proveedor de pago simulado. Se usa cuando `STORE_MODE=demo`.
 *
 * Cumple el mismo contrato `PaymentProvider` que Stripe y Mercado Pago, así que
 * el checkout no sabe ni le importa que el pago sea falso: pide un
 * `PaymentIntentResult`, recibe una URL, y redirige. La diferencia es que la URL
 * apunta a una página de la propia app en vez de a un dominio externo.
 *
 * El flujo simulado replica el real de punta a punta:
 *   1. `createPaymentIntent` devuelve `/checkout/demo-payment/<orderId>`.
 *   2. El usuario elige aprobar o rechazar en esa página.
 *   3. La server action construye el mismo payload que produciría un webhook y
 *      lo pasa por `parseWebhookEvent` + `processPaymentEvent` — es decir, por
 *      exactamente el mismo código que corre en producción.
 *
 * El punto 3 importa: el mock no toca la base por su cuenta ni tiene una ruta
 * paralela de actualización de órdenes. Si lo hiciera, una demo podría "andar"
 * mientras el flujo real está roto, y el valor de tener adaptadores se pierde.
 */

/** Prefijo del `providerRef` simulado. Hace obvio en la DB qué pagos son falsos. */
const MOCK_REF_PREFIX = "demo_pay_";

/**
 * El `providerRef` es determinístico a partir del orderId, no aleatorio.
 *
 * Es a propósito: el constraint único `(provider, providerRef)` de PaymentEvent
 * es lo que da idempotencia, así que un ref determinístico hace que reintentar
 * el mismo pago simulado sea un no-op — igual que un reintento de webhook real.
 * Con un ref aleatorio cada click generaría un evento nuevo y la demo mentiría
 * sobre el comportamiento de producción.
 */
function refForOrder(orderId: string): string {
  return `${MOCK_REF_PREFIX}${orderId}`;
}

/** Payload que produce nuestra página de pago simulado. */
interface MockWebhookPayload {
  orderId: string;
  status: PaymentEventStatus;
}

export const mockPaymentAdapter: PaymentProvider = {
  type: "MOCK",
  isReal: false,

  async createPaymentIntent(order: PaymentOrderInput): Promise<PaymentIntentResult> {
    // No hay llamada de red: el "proveedor" es una ruta de esta misma app.
    // Igual devolvemos una Promise para no romper el contrato de la interfaz.
    return {
      provider: "MOCK",
      checkoutUrl: `/checkout/demo-payment/${order.orderId}`,
      providerRef: refForOrder(order.orderId),
    };
  },

  verifyWebhookSignature(): boolean {
    // El mock no tiene una superficie de webhook expuesta a internet: el evento
    // lo origina una server action de esta app, que ya valida sesión, dueño de
    // la orden y `STORE_MODE=demo`. No hay nada que firmar.
    //
    // Devuelve false a propósito para que, si alguien montara una ruta pública
    // de webhook para el mock por error, no acepte nada sin firma.
    return false;
  },

  async parseWebhookEvent(rawBody: string): Promise<PaymentEvent | null> {
    let payload: MockWebhookPayload;
    try {
      payload = JSON.parse(rawBody) as MockWebhookPayload;
    } catch {
      return null;
    }

    if (!payload.orderId) return null;
    if (!["approved", "rejected", "pending"].includes(payload.status)) return null;

    return {
      provider: "MOCK",
      orderId: payload.orderId,
      status: payload.status,
      providerRef: refForOrder(payload.orderId),
      rawType: `demo.payment.${payload.status}`,
      simulated: true,
    };
  },

  async getPaymentStatus(providerRef: string): Promise<PaymentStatusResult> {
    // Sin proveedor externo al que preguntar, la fuente de verdad es lo que
    // quedó registrado en nuestra propia base.
    const orderId = providerRef.startsWith(MOCK_REF_PREFIX)
      ? providerRef.slice(MOCK_REF_PREFIX.length)
      : providerRef;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true, totalCents: true, currency: true },
    });

    if (!order) {
      throw new Error(`No existe una orden para el pago simulado ${providerRef}.`);
    }

    let status: PaymentEventStatus;
    if (order.status === "PAID" || order.status === "FULFILLED") {
      status = "approved";
    } else if (
      order.status === "CANCELLED" ||
      order.status === "EXPIRED" ||
      order.status === "REFUNDED"
    ) {
      status = "rejected";
    } else {
      status = "pending";
    }

    return {
      provider: "MOCK",
      providerRef,
      status,
      rawStatus: `order:${order.status}`,
      amountCents: order.totalCents,
      currency: order.currency,
    };
  },
};

/** Serializa el payload que la página de pago simulado le pasa al adapter. */
export function buildMockWebhookBody(orderId: string, status: PaymentEventStatus): string {
  return JSON.stringify({ orderId, status } satisfies MockWebhookPayload);
}
