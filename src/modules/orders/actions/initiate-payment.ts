"use server";

import type { PaymentProviderType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getPaymentProvider, resolvePaymentProviderType } from "@/lib/payments";
import type { PaymentIntentResult } from "@/lib/payments/types";
import { prisma } from "@/lib/prisma";
import { getCartWithItems } from "@/src/modules/cart/actions/get-cart";
import type { InitiatePaymentState } from "@/src/modules/orders/types/payment-state";

import { createOrderFromCart } from "./create-order";

export async function initiatePayment(
  _state: InitiatePaymentState,
  formData: FormData
): Promise<InitiatePaymentState> {
  const addressId = formData.get("addressId") as string | null;
  const street = formData.get("street") as string | null;
  const city = formData.get("city") as string | null;
  const stateValue = formData.get("state") as string | null;
  const postalCode = formData.get("postalCode") as string | null;
  const country = formData.get("country") as string | null;
  const phone = formData.get("phone") as string | undefined;
  const payerEmail = (formData.get("payerEmail") as string | null) || undefined;

  const requestedProvider = formData.get("paymentProviderType");

  /**
   * El proveedor NO sale del formulario: sale de `resolvePaymentProviderType`,
   * que en modo demo devuelve siempre MOCK. Lo que manda el form es apenas una
   * preferencia y solo se respeta en producción. Así una instalación en demo no
   * puede iniciar un cobro real ni manipulando el HTML.
   */
  const paymentProviderType = resolvePaymentProviderType(
    typeof requestedProvider === "string" && requestedProvider
      ? (requestedProvider as PaymentProviderType)
      : undefined
  );

  const cart = await getCartWithItems();

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  const addressDetails =
    street && city && stateValue && postalCode && country
      ? {
          street,
          city,
          state: stateValue,
          postalCode,
          country,
          phone,
        }
      : null;

  const order = await createOrderFromCart(
    cart,
    addressId,
    addressDetails,
    paymentProviderType,
    payerEmail
  );

  const paymentProvider = getPaymentProvider(paymentProviderType);
  const paymentResult = await paymentProvider.createPaymentIntent({
    orderId: order.id,
    amountCents: order.totalCents,
    currency: order.currency,
    description: `Pedido #${order.id}`,
    payerEmail,
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { paymentRef: paymentResult.providerRef },
  });

  // Ojo: los route groups de Next (ej. "(storefront)") son solo organización de
  // carpetas y NO forman parte de la URL — el path real acá es "/cart".
  revalidatePath("/cart");
  revalidatePath(`/orders/${order.id}`);

  // El mock no monta ningún widget: manda a una página de esta misma app donde
  // se elige el resultado del pago. `redirect` lanza, así que nada de abajo corre.
  if (paymentResult.provider === "MOCK") {
    redirect(paymentResult.checkoutUrl);
  }

  return {
    orderId: order.id,
    paymentProvider: paymentProviderType,
    totalCents: order.totalCents,
    clientSecret:
      paymentResult.provider === "STRIPE"
        ? (paymentResult as Extract<PaymentIntentResult, { provider: "STRIPE" }>).clientSecret
        : undefined,
    preferenceId:
      paymentResult.provider === "MERCADO_PAGO"
        ? (paymentResult as Extract<PaymentIntentResult, { provider: "MERCADO_PAGO" }>).preferenceId
        : undefined,
    initPoint:
      paymentResult.provider === "MERCADO_PAGO"
        ? (paymentResult as Extract<PaymentIntentResult, { provider: "MERCADO_PAGO" }>).initPoint
        : undefined,
    providerRef: paymentResult.providerRef,
    payerEmail,
    error: null,
  };
}
