"use server";

import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/lib/payments";
import { getCartWithItems } from "@/src/modules/cart/actions/get-cart";
import { createOrderFromCart } from "./create-order";
import { revalidatePath } from "next/cache";
import type { PaymentIntentResult } from "@/src/modules/payments/types/payment-provider";

export async function initiatePayment(
  state: {
    orderId: string;
    paymentProvider: "STRIPE" | "MERCADO_PAGO";
    totalCents: number;
    clientSecret: string | undefined;
    preferenceId: string | undefined;
    initPoint: string | undefined;
    providerRef: string;
    payerEmail: string | undefined;
    error: string | null;
  },
  formData: FormData
) {
  // Get form data from formData parameter
  const addressId = formData.get("addressId") as string | null;
  const street = formData.get("street") as string | null;
  const city = formData.get("city") as string | null;
  const stateValue = formData.get("state") as string | null; // Renamed to avoid conflict with parameter
  const postalCode = formData.get("postalCode") as string | null;
  const country = formData.get("country") as string | null;
  const phone = formData.get("phone") as string | undefined;
  const paymentProviderType = formData.get("paymentProviderType") as "STRIPE" | "MERCADO_PAGO";
  const payerEmail = formData.get("payerEmail") as string | undefined;

  // 1. Get the current cart with items (needed for order creation)
  const cart = await getCartWithItems();

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  // 2. Prepare address details if provided via form
  const addressDetails =
    street && city && stateValue && postalCode && country
      ? {
          street,
          city,
          state: stateValue,
          postalCode,
          country,
          phone: phone, // Keep as undefined if not provided (matches optional param in createOrderFromCart)
        }
      : null;

  // 3. Create the order from the cart
  const order = await createOrderFromCart(
    cart,
    addressId,
    addressDetails,
    paymentProviderType,
    payerEmail
  );

  // 4. Prepare payment data
  const paymentOrderInput = {
    orderId: order.id,
    amountCents: order.totalCents,
    currency: order.currency, // use the currency from the order
    description: `Pedido #${order.id}`,
    payerEmail,
  };

  // 5. Get the appropriate payment provider and initiate payment
  const paymentProvider = getPaymentProvider(paymentProviderType);
  const paymentResult = await paymentProvider.createPaymentIntent(paymentOrderInput);

  // 6. Update the order with the payment reference
  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentRef: paymentResult.providerRef,
    },
  });

  // 7. Revalidate paths. Ojo: los route groups de Next (ej. "(storefront)")
  // son solo organización de carpetas y NO forman parte de la URL — el path
  // real acá es "/cart", no "/(storefront)/cart".
  revalidatePath("/cart");
  revalidatePath(`/order/${order.id}`);

  // 8. Return the payment data needed by the frontend - shaped to match useActionState expectations
  return {
    orderId: order.id,
    paymentProvider: paymentProviderType,
    totalCents: order.totalCents,
    clientSecret:
      paymentProviderType === "STRIPE"
        ? (paymentResult as Extract<PaymentIntentResult, { provider: "STRIPE" }>).clientSecret
        : undefined,
    preferenceId:
      paymentProviderType === "MERCADO_PAGO"
        ? (paymentResult as Extract<PaymentIntentResult, { provider: "MERCADO_PAGO" }>).preferenceId
        : undefined,
    initPoint:
      paymentProviderType === "MERCADO_PAGO"
        ? (paymentResult as Extract<PaymentIntentResult, { provider: "MERCADO_PAGO" }>).initPoint
        : undefined,
    providerRef: paymentResult.providerRef,
    payerEmail,
    error: null,
  };
}