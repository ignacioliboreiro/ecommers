import "server-only";

import type { PaymentProviderType } from "@prisma/client";

import type { PaymentProvider } from "@/src/modules/payments/types/payment-provider";

import { mercadoPagoAdapter } from "./mercadopago-adapter";
import { stripeAdapter } from "./stripe-adapter";

/**
 * Factory: devuelve el adapter que implementa `PaymentProvider` según el
 * `PaymentProviderType` de la orden. El flujo de checkout usa esto y nunca
 * importa un adapter concreto directamente.
 */
export function getPaymentProvider(type: PaymentProviderType): PaymentProvider {
  switch (type) {
    case "STRIPE":
      return stripeAdapter;
    case "MERCADO_PAGO":
      return mercadoPagoAdapter;
    default:
      // exhaustividad: si se agrega un provider al enum, TS marca acá.
      return assertNever(type);
  }
}

function assertNever(value: never): never {
  throw new Error(`PaymentProviderType no soportado: ${String(value)}`);
}
