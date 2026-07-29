"use server";

import { getShippingProvider } from "@/lib/shipping";
import { getCartWithItems } from "@/src/modules/cart/actions/get-cart";

export interface ShippingEstimate {
  serviceName: string;
  costCents: number;
  freeShippingApplied: boolean;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
}

/**
 * Cotiza el envío del carrito actual a un destino, para mostrarlo en el checkout
 * antes de confirmar.
 *
 * Es una **estimación**: la cotización que termina en la orden la vuelve a
 * calcular `createOrderFromCart` en el servidor. Duplicar la llamada es
 * intencional — el precio no puede depender de lo que el cliente diga que le
 * cotizaron.
 *
 * Los ítems salen del carrito del servidor, no del formulario: solo el destino
 * viene del cliente.
 */
export async function quoteShipping(
  state: string,
  postalCode: string,
  city: string
): Promise<ShippingEstimate | null> {
  if (!state?.trim() || !postalCode?.trim()) return null;

  const cart = await getCartWithItems();
  if (!cart || cart.items.length === 0) return null;

  try {
    const quote = await getShippingProvider().calculateShippingCost(
      {
        city: city?.trim() || "",
        state: state.trim(),
        postalCode: postalCode.trim(),
        country: "AR",
      },
      cart.items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
        unitPriceCents: item.variant.priceCents,
      }))
    );

    return {
      serviceName: quote.serviceName,
      costCents: quote.costCents,
      freeShippingApplied: quote.freeShippingApplied,
      estimatedDaysMin: quote.estimatedDaysMin,
      estimatedDaysMax: quote.estimatedDaysMax,
    };
  } catch (err) {
    // Un courier real caído no debe impedir avanzar al pago: la cotización
    // autoritativa se hace igual al crear la orden.
    console.error("[shipping] No se pudo cotizar el envío para el checkout:", err);
    return null;
  }
}
