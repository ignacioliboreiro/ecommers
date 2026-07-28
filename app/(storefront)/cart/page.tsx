import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/money";
import { getCart } from "@/src/modules/cart/actions/get-cart";
import { CartList } from "@/src/modules/cart/components/cart-list";

export const metadata: Metadata = {
  title: "Carrito",
};

export default async function CartPage() {
  const cart = await getCart();

  if (cart.items.length === 0) {
    return (
      <div className="animate-in fade-in mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="size-6 text-muted-foreground" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Tu carrito está vacío</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Explorá el catálogo y agregá algún producto para empezar tu compra.
        </p>
        <Button
          render={<Link href="/products">Ver productos</Link>}
          nativeButton={false}
          className="mt-6"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Tu carrito</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {cart.itemCount} {cart.itemCount === 1 ? "producto" : "productos"}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CartList items={cart.items} />
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl bg-card p-6 ring-1 ring-white/10">
            <h2 className="text-sm font-medium">Resumen</h2>
            <div className="mt-4 flex flex-col gap-2 border-b border-border pb-4">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">{formatCents(cart.subtotalCents)}</span>
              </div>
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-muted-foreground">Envío</span>
                <span className="text-muted-foreground">Se calcula al pagar</span>
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="font-medium">Total</span>
              <span className="text-xl font-semibold tabular-nums">
                {formatCents(cart.subtotalCents)}
              </span>
            </div>
            <Button
              render={<Link href="/checkout">Finalizar compra</Link>}
              nativeButton={false}
              size="lg"
              className="mt-6 w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
