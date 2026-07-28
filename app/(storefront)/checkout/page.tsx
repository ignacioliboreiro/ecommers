import type { Metadata } from "next";

import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight mb-6">Checkout</h1>
      <CheckoutForm />
    </div>
  );
}
