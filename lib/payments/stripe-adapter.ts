import "server-only";

import Stripe from "stripe";

import type {
  PaymentEvent,
  PaymentEventStatus,
  PaymentIntentResult,
  PaymentOrderInput,
  PaymentProvider,
  PaymentStatusResult,
} from "./types";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY no está definido.");
  // Sin apiVersion explícita: el SDK usa la versión con la que fue publicado.
  return new Stripe(key);
}

function webhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET no está definido.");
  return secret;
}

/** Mapea el status del PaymentIntent de Stripe a nuestro estado interno. */
function mapStatus(status: Stripe.PaymentIntent.Status): PaymentEventStatus {
  switch (status) {
    case "succeeded":
      return "approved";
    case "canceled":
      return "rejected";
    // requires_payment_method / requires_confirmation / processing / etc.
    default:
      return "pending";
  }
}

export const stripeAdapter: PaymentProvider = {
  type: "STRIPE",
  isReal: true,

  async createPaymentIntent(order: PaymentOrderInput): Promise<PaymentIntentResult> {
    const stripe = getStripe();

    // TODO(Paso C): decidir capture_method (automático vs manual), si usamos
    // customer guardado, y automatic_payment_methods vs lista explícita.
    const intent = await stripe.paymentIntents.create({
      amount: order.amountCents,
      currency: order.currency,
      description: order.description,
      receipt_email: order.payerEmail,
      // metadata.orderId es CLAVE: es como recuperamos la orden en el webhook.
      metadata: { orderId: order.orderId },
      automatic_payment_methods: { enabled: true },
    });

    if (!intent.client_secret) {
      throw new Error("Stripe no devolvió client_secret para el PaymentIntent.");
    }

    return {
      provider: "STRIPE",
      clientSecret: intent.client_secret,
      providerRef: intent.id,
    };
  },

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    try {
      // constructEvent lanza si la firma no valida; lo usamos solo para verificar.
      getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret());
      return true;
    } catch {
      return false;
    }
  },

  async parseWebhookEvent(rawBody: string): Promise<PaymentEvent | null> {
    // El payload de Stripe ya trae el objeto completo, no hace falta refetch.
    const event = JSON.parse(rawBody) as Stripe.Event;

    // Solo nos interesan eventos de PaymentIntent por ahora.
    if (!event.type.startsWith("payment_intent.")) return null;

    const intent = event.data.object as Stripe.PaymentIntent;
    const orderId = intent.metadata?.orderId;
    if (!orderId) return null;

    return {
      provider: "STRIPE",
      orderId,
      status: mapStatus(intent.status),
      providerRef: intent.id,
      rawType: event.type,
    };
  },

  async getPaymentStatus(providerRef: string): Promise<PaymentStatusResult> {
    const intent = await getStripe().paymentIntents.retrieve(providerRef);

    return {
      provider: "STRIPE",
      providerRef: intent.id,
      status: mapStatus(intent.status),
      rawStatus: intent.status,
      amountCents: intent.amount,
      currency: intent.currency,
    };
  },
};
