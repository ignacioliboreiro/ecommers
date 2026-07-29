import type { PaymentProviderType } from "@prisma/client";

/**
 * Estado del formulario de checkout (`useActionState`).
 *
 * Vive acá y no junto a la action porque un archivo `"use server"` **solo puede
 * exportar funciones async** — exportar el objeto de estado inicial desde ahí
 * rompe el build con "A 'use server' file can only export async functions".
 */
export interface InitiatePaymentState {
  orderId: string;
  paymentProvider: PaymentProviderType;
  totalCents: number;
  /** Stripe: se pasa al PaymentElement. */
  clientSecret: string | undefined;
  /** Mercado Pago: se pasa al Brick. */
  preferenceId: string | undefined;
  initPoint: string | undefined;
  providerRef: string;
  payerEmail: string | undefined;
  error: string | null;
}

export const INITIATE_PAYMENT_INITIAL_STATE: InitiatePaymentState = {
  orderId: "",
  paymentProvider: "MERCADO_PAGO",
  totalCents: 0,
  clientSecret: undefined,
  preferenceId: undefined,
  initPoint: undefined,
  providerRef: "",
  payerEmail: undefined,
  error: null,
};
