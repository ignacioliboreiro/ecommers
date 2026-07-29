import type { PaymentProviderType } from "@prisma/client";

/**
 * Contrato común que todos los proveedores de pago (Stripe, Mercado Pago, y el
 * simulado de las demos) deben implementar. El flujo de checkout habla siempre
 * con esta interfaz y nunca directamente con un SDK, para poder cambiar de
 * proveedor sin tocar la lógica de negocio.
 *
 * Vive en `lib/payments/` junto a las implementaciones a propósito: es un
 * contrato de infraestructura, no un shape de dominio (que iría en
 * `src/modules/<módulo>/types/` según AGENTS.md).
 */

/** Datos normalizados de una orden que un proveedor necesita para cobrar. */
export interface PaymentOrderInput {
  /** id interno de nuestra Order — viaja como metadata/external_reference. */
  orderId: string;
  /** Total a cobrar en centavos (fuente de verdad = Order.totalCents). */
  amountCents: number;
  /** ISO 4217 en minúscula para Stripe (ej "usd"/"ars"). */
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
 * - Mock: una URL interna de la propia app donde se simula el pago.
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
    }
  | {
      provider: "MOCK";
      /** Ruta interna (no un dominio externo) donde el usuario simula el pago. */
      checkoutUrl: string;
      /** id de referencia que guardamos en Order.paymentRef. */
      providerRef: string;
    };

/** Estado interno normalizado, agnóstico del proveedor. */
export type PaymentEventStatus = "approved" | "rejected" | "pending";

/**
 * Evento de pago ya normalizado. `providerRef` es el id de la transacción en el
 * proveedor (PaymentIntent id / payment id de MP); junto con `provider` es lo
 * que usamos para la idempotencia (constraint único en el modelo PaymentEvent).
 */
export interface PaymentEvent {
  provider: PaymentProviderType;
  orderId: string;
  status: PaymentEventStatus;
  providerRef: string;
  /** Tipo crudo del proveedor (ej "payment_intent.succeeded", "payment"). Para logs/debug. */
  rawType: string;
  /**
   * true si el evento lo generó el adapter simulado en vez de un webhook real.
   * Se persiste en `PaymentEvent.simulated` para poder distinguir después qué
   * órdenes de una base son de demostración.
   */
  simulated?: boolean;
}

/**
 * Estado de un pago consultado *a demanda* al proveedor, en vez de recibido por
 * webhook. Sirve para reconciliar cuando un webhook se perdió, y para que el
 * panel admin pueda preguntar "¿este pago existe realmente del otro lado?".
 * `amountCents`/`currency` son opcionales porque no todos los proveedores los
 * devuelven en la consulta de estado.
 */
export interface PaymentStatusResult {
  provider: PaymentProviderType;
  providerRef: string;
  status: PaymentEventStatus;
  /** Status crudo del proveedor, sin normalizar (para logs y soporte). */
  rawStatus: string;
  amountCents?: number;
  currency?: string;
}

/**
 * Contexto extra para verificar la firma. La interfaz base recibe
 * `(rawBody, signature)`, pero Mercado Pago necesita además el header
 * `x-request-id` y el `data.id` del query para reconstruir el manifest
 * firmado — va acá y Stripe simplemente lo ignora.
 */
export interface WebhookVerifyContext {
  headers?: Record<string, string>;
  query?: Record<string, string>;
}

export interface PaymentProvider {
  readonly type: PaymentProviderType;

  /**
   * true si el proveedor mueve plata de verdad. El único `false` es el mock.
   * Se usa para decidir si mostrar advertencias en la UI sin tener que
   * comparar contra el literal "MOCK" en cada lugar.
   */
  readonly isReal: boolean;

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

  /** Consulta el estado actual de un pago por su id en el proveedor. */
  getPaymentStatus(providerRef: string): Promise<PaymentStatusResult>;
}
