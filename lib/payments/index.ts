import "server-only";

import type { PaymentProviderType } from "@prisma/client";

import { isDemoMode } from "@/lib/config/store-mode";

import { mercadoPagoAdapter } from "./mercadopago-adapter";
import { mockPaymentAdapter } from "./mock-provider";
import { stripeAdapter } from "./stripe-adapter";
import type { PaymentProvider } from "./types";

/**
 * Proveedor real por default cuando la instalación está en producción. Se puede
 * cambiar por env sin tocar código; si el valor es inválido se usa Mercado Pago
 * (el único con el flujo de checkout terminado, ver deuda técnica de Stripe).
 */
function defaultRealProviderType(): PaymentProviderType {
  const raw = process.env.PAYMENT_PROVIDER?.trim().toUpperCase();
  if (raw === "STRIPE" || raw === "MERCADO_PAGO") return raw;
  if (raw) {
    console.warn(
      `[payments] PAYMENT_PROVIDER="${process.env.PAYMENT_PROVIDER}" no es válido ` +
        `(esperado: STRIPE | MERCADO_PAGO). Usando MERCADO_PAGO.`
    );
  }
  return "MERCADO_PAGO";
}

/**
 * Qué proveedor debe usar un checkout nuevo.
 *
 * En modo demo devuelve SIEMPRE `MOCK`, ignorando lo que pida el caller. Eso es
 * el punto: aunque alguien manipule el formulario para pedir Mercado Pago, una
 * instalación en demo no puede iniciar un cobro real. La decisión no está en la
 * UI (que es manipulable) sino acá, en el servidor.
 */
export function resolvePaymentProviderType(requested?: PaymentProviderType): PaymentProviderType {
  if (isDemoMode()) return "MOCK";
  if (requested && requested !== "MOCK") return requested;
  return defaultRealProviderType();
}

/**
 * Factory: devuelve el adapter que implementa `PaymentProvider`.
 *
 * - Sin argumento → resuelve por `STORE_MODE` (lo que usa el checkout).
 * - Con argumento → resuelve ese proveedor puntual, sin mirar el modo. Los
 *   webhooks necesitan esta forma: tienen que interpretar el evento con el
 *   proveedor que originó la orden, no con el modo actual de la instalación
 *   (si no, cambiar `STORE_MODE` dejaría huérfanas las órdenes en vuelo).
 */
export function getPaymentProvider(type?: PaymentProviderType): PaymentProvider {
  const resolved = type ?? resolvePaymentProviderType();

  switch (resolved) {
    case "STRIPE":
      return stripeAdapter;
    case "MERCADO_PAGO":
      return mercadoPagoAdapter;
    case "MOCK":
      return mockPaymentAdapter;
    default:
      // exhaustividad: si se agrega un provider al enum, TS marca acá.
      return assertNever(resolved);
  }
}

function assertNever(value: never): never {
  throw new Error(`PaymentProviderType no soportado: ${String(value)}`);
}

// Los webhooks importan su adapter directo porque la ruta ya es específica del
// proveedor (/api/webhooks/stripe, /api/webhooks/mercadopago).
export { mercadoPagoAdapter, mockPaymentAdapter, stripeAdapter };
