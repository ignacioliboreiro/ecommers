import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/money";
import { getCart } from "@/src/modules/cart/actions/get-cart";
import { CartItemRow } from "@/src/modules/cart/components/cart-item-row";

export const metadata: Metadata = {
  title: "Carrito",
};

export default async function CartPage() {
  const cart = await getCart();

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-12 text-center">
        <h1 className="text-2xl font-semibold">Tu carrito está vacío</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Explorá el catálogo y agregá productos.
        </p>
        <Button render={<Link href="/products">Ver productos</Link>} className="mt-6" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Tu carrito</h1>

      <ul className="mt-6 divide-y">
        {cart.items.map((item) => (
          <CartItemRow key={item.id} item={item} />
        ))}
      </ul>

      <div className="mt-6 flex flex-col items-end gap-4 border-t pt-6">
        <div className="flex w-full max-w-xs items-baseline justify-between">
          <span className="text-sm text-muted-foreground">
            Subtotal ({cart.itemCount} {cart.itemCount === 1 ? "producto" : "productos"})
          </span>
          <span className="text-xl font-semibold">{formatCents(cart.subtotalCents)}</span>
        </div>
        <Button disabled className="w-full max-w-xs">
          Finalizar compra (próximamente)
        </Button>
      </div>
    </div>
  );
}
