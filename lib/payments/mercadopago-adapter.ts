import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

import type {
  PaymentEvent,
  PaymentEventStatus,
  PaymentIntentResult,
  PaymentOrderInput,
  PaymentProvider,
  PaymentStatusResult,
  WebhookVerifyContext,
} from "./types";

function getConfig(): MercadoPagoConfig {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN no está definido.");
  return new MercadoPagoConfig({ accessToken });
}

function webhookSecret(): string {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) throw new Error("MERCADOPAGO_WEBHOOK_SECRET no está definido.");
  return secret;
}

/** Mapea el status del pago de Mercado Pago a nuestro estado interno. */
function mapStatus(status: string | undefined): PaymentEventStatus {
  switch (status) {
    case "approved":
      return "approved";
    case "rejected":
    case "cancelled":
      return "rejected";
    // pending / in_process / authorized / etc.
    default:
      return "pending";
  }
}

export const mercadoPagoAdapter: PaymentProvider = {
  type: "MERCADO_PAGO",
  isReal: true,

  async createPaymentIntent(order: PaymentOrderInput): Promise<PaymentIntentResult> {
    const preferenceClient = new Preference(getConfig());

    // TODO(Paso C/D): back_urls (success/failure/pending), notification_url del
    // webhook, y desglose real de items en vez de un único ítem agregado.
    const preference = await preferenceClient.create({
      body: {
        items: [
          {
            id: order.orderId,
            title: order.description,
            quantity: 1,
            unit_price: order.amountCents / 100, // MP usa unidades, no centavos
            currency_id: order.currency.toUpperCase(),
          },
        ],
        // external_reference es CLAVE: así recuperamos la orden en el webhook.
        external_reference: order.orderId,
        payer: order.payerEmail ? { email: order.payerEmail } : undefined,
      },
    });

    if (!preference.id || !preference.init_point) {
      throw new Error("Mercado Pago no devolvió preference id / init_point.");
    }

    return {
      provider: "MERCADO_PAGO",
      preferenceId: preference.id,
      initPoint: preference.init_point,
      providerRef: preference.id,
    };
  },

  verifyWebhookSignature(
    _rawBody: string,
    signature: string,
    context?: WebhookVerifyContext
  ): boolean {
    // MP firma un "manifest" con partes que vienen de headers/query, no del body:
    //   id:<data.id>;request-id:<x-request-id>;ts:<ts>;
    // El header x-signature trae "ts=<ts>,v1=<hmac>".
    const requestId = context?.headers?.["x-request-id"];
    const dataId = context?.query?.["data.id"] ?? context?.query?.["id"];
    if (!signature || !requestId || !dataId) return false;

    const parts = Object.fromEntries(
      signature.split(",").map((kv) => {
        const [k, v] = kv.split("=");
        return [k?.trim(), v?.trim()];
      })
    ) as { ts?: string; v1?: string };
    if (!parts.ts || !parts.v1) return false;

    const manifest = `id:${dataId};request-id:${requestId};ts:${parts.ts};`;
    const expected = createHmac("sha256", webhookSecret()).update(manifest).digest("hex");

    const a = Buffer.from(parts.v1, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  },

  async parseWebhookEvent(rawBody: string): Promise<PaymentEvent | null> {
    const body = JSON.parse(rawBody) as {
      type?: string;
      action?: string;
      data?: { id?: string };
    };

    // MP manda varios tipos; solo procesamos notificaciones de pago.
    if (body.type !== "payment" || !body.data?.id) return null;

    // El webhook solo trae el id: hay que consultar el pago para el status real.
    const paymentClient = new Payment(getConfig());
    const payment = await paymentClient.get({ id: body.data.id });

    const orderId = payment.external_reference;
    if (!orderId) return null;

    return {
      provider: "MERCADO_PAGO",
      orderId,
      status: mapStatus(payment.status),
      providerRef: String(payment.id ?? body.data.id),
      rawType: body.action ?? body.type,
    };
  },

  async getPaymentStatus(providerRef: string): Promise<PaymentStatusResult> {
    const payment = await new Payment(getConfig()).get({ id: providerRef });

    return {
      provider: "MERCADO_PAGO",
      providerRef,
      status: mapStatus(payment.status),
      rawStatus: payment.status ?? "unknown",
      // MP maneja unidades, no centavos.
      amountCents:
        typeof payment.transaction_amount === "number"
          ? Math.round(payment.transaction_amount * 100)
          : undefined,
      currency: payment.currency_id ?? undefined,
    };
  },
};
