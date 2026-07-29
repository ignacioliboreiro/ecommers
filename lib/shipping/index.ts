import "server-only";

import { isDemoMode } from "@/lib/config/store-mode";

import { andreaniAdapter } from "./andreani-provider";
import { correoArgentinoAdapter } from "./correo-argentino-provider";
import { mockShippingAdapter } from "./mock-provider";
import type { ShippingProvider, ShippingProviderId } from "./types";

/**
 * Factory de envíos, mismo criterio que `lib/payments`:
 *
 * - `STORE_MODE=demo` → siempre el simulado, ignorando `SHIPPING_PROVIDER`. Una
 *   demo no puede generar una etiqueta real ni gastar saldo de un contrato.
 * - `STORE_MODE=production` → el courier que diga `SHIPPING_PROVIDER`.
 */
function productionProviderId(): ShippingProviderId {
  const raw = process.env.SHIPPING_PROVIDER?.trim().toLowerCase();

  if (raw === "correo-argentino" || raw === "andreani" || raw === "mock") {
    return raw;
  }

  if (raw) {
    console.warn(
      `[shipping] SHIPPING_PROVIDER="${process.env.SHIPPING_PROVIDER}" no es válido ` +
        `(esperado: correo-argentino | andreani | mock). Usando "mock".`
    );
  } else {
    console.warn(
      "[shipping] STORE_MODE=production pero SHIPPING_PROVIDER no está definido. " +
        'Usando el adapter simulado ("mock"): los envíos NO se despachan.'
    );
  }

  // Default a "mock" y no a un courier real: sin credenciales, un courier real
  // lanzaría y dejaría el checkout sin poder cotizar. Es preferible una tienda
  // que cotiza de mentira y avisa por consola, a una que no puede vender.
  return "mock";
}

export function getShippingProvider(): ShippingProvider {
  const id: ShippingProviderId = isDemoMode() ? "mock" : productionProviderId();

  switch (id) {
    case "mock":
      return mockShippingAdapter;
    case "correo-argentino":
      return correoArgentinoAdapter;
    case "andreani":
      return andreaniAdapter;
    default:
      return assertNever(id);
  }
}

/**
 * Resuelve un adapter por su id, sin mirar el modo. Lo necesita la consulta de
 * tracking: un envío generado con un courier tiene que consultarse con **ese**
 * courier, aunque después se haya cambiado `SHIPPING_PROVIDER`. Por eso
 * `Order.shippingProvider` guarda el id que lo generó.
 */
export function getShippingProviderById(id: string): ShippingProvider | null {
  switch (id) {
    case "mock":
      return mockShippingAdapter;
    case "correo-argentino":
      return correoArgentinoAdapter;
    case "andreani":
      return andreaniAdapter;
    default:
      return null;
  }
}

function assertNever(value: never): never {
  throw new Error(`ShippingProviderId no soportado: ${String(value)}`);
}

export { andreaniAdapter, correoArgentinoAdapter, mockShippingAdapter };
