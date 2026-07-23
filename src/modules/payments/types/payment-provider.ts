import type { PaymentProviderType } from "@prisma/client";

/**
 * Contrato común que todos los proveedores de pago (Stripe, Mercado Pago)
 * deben implementar. La idea es que el flujo de checkout hable siempre con
 * esta interfaz y nunca directamente con un SDK, para poder cambiar de
 * proveedor sin tocar la lógica de negocio.
 */

/** Datos normalizados de una orden que un proveedor necesita para cobrar. */
export interface PaymentOrderInput {
  /** id interno de nuestra Order — viaja como metadata/external_reference. */
  orderId: string;
  /** Total a cobrar en centavos (fuente de verdad = Order.totalCents). */
  amountCents: number;
  /** ISO 4217 en minúscula para Stripe (ej "usd"/"ars"). TODO(Paso C): definir moneda por región. */
  currency: string;
  /** Descripción corta para el resumen del proveedor. */
  description: string;
  /** Email del comprador, si lo tenemos (mejora la UI del Brick/Element). */
  payerEmail?: string;
}

/**
 * Resultado de iniciar un pago. Es una unión discriminada porque cada
 * proveedor le da al frontend cosas distintas para montar su widget:
 * - Stripe: `clientSecret` para el PaymentElement.
 * - Mercado Pago: `preferenceId` (Checkout Bricks/Pro) + `initPoint`.
 */
export type PaymentIntentResult =
  | {
      provider: "STRIPE";
      /** Se pasa al `<PaymentElement>` vía `Elements options={{ clientSecret }}`. */
      clientSecret: string;
      /** id del PaymentIntent, se guarda en Order.paymentRef. */
      providerRef: string;
    }
  | {
      provider: "MERCADO_PAGO";
      /** id de la Preference, se pasa al Brick de MP. */
      preferenceId: string;
      /** URL de Checkout Pro como fallback/redirect. */
      initPoint: string;
      /** id de referencia que guardamos en Order.paymentRef. */
      providerRef: string;
    };

/** Estado interno normalizado, agnóstico del proveedor. */
export type PaymentEventStatus = "approved" | "rejected" | "pending";

/**
 * Evento de webhook ya normalizado. `providerRef` es el id de la transacción
 * en el proveedor (PaymentIntent id / payment id de MP); junto con `orderId`
 * es lo que usamos para la idempotencia (ver resumen).
 */
export interface PaymentEvent {
  provider: PaymentProviderType;
  orderId: string;
  status: PaymentEventStatus;
  providerRef: string;
  /** Tipo crudo del proveedor (ej "payment_intent.succeeded", "payment"). Para logs/debug. */
  rawType: string;
}

/**
 * Contexto extra para verificar la firma. La interfaz base recibe
 * `(rawBody, signature)` como pediste, pero Mercado Pago necesita además
 * el header `x-request-id` y el `data.id` del query para reconstruir el
 * manifest firmado — va acá y Stripe simplemente lo ignora.
 */
export interface WebhookVerifyContext {
  headers?: Record<string, string>;
  query?: Record<string, string>;
}

export interface PaymentProvider {
  readonly type: PaymentProviderType;

  /** Inicia un pago para una orden y devuelve lo que el frontend necesita. */
  createPaymentIntent(order: PaymentOrderInput): Promise<PaymentIntentResult>;

  /**
   * Valida que el webhook venga realmente del proveedor.
   * Devuelve true/false; no lanza ante firma inválida (el caller responde 400).
   */
  verifyWebhookSignature(
    rawBody: string,
    signature: string,
    context?: WebhookVerifyContext
  ): boolean;

  /**
   * Normaliza el payload del webhook a un `PaymentEvent`.
   * Es async porque Mercado Pago solo manda el id del pago en el webhook y
   * hay que consultar su API para conocer status + orderId (external_reference).
   * Devuelve null si el evento no es de pago (lo ignoramos).
   */
  parseWebhookEvent(rawBody: string): Promise<PaymentEvent | null>;
}
