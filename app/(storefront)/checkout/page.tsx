import type { Metadata } from "next";

import { isDemoMode } from "@/lib/config/store-mode";

import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
};

export default function CheckoutPage() {
  // El modo se resuelve en el servidor y baja por props: el Client Component no
  // puede leer STORE_MODE (no es NEXT_PUBLIC_) y tampoco debería decidirlo.
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">Checkout</h1>
      <CheckoutForm demoMode={isDemoMode()} />
    </div>
  );
}
