import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import { getCart } from "@/src/modules/cart/actions/get-cart";

export async function CartIcon() {
  const { itemCount } = await getCart();

  return (
    <Link
      href="/cart"
      className="relative inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
      aria-label={`Carrito, ${itemCount} ${itemCount === 1 ? "producto" : "productos"}`}
    >
      <ShoppingCart className="size-5" aria-hidden />
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </Link>
  );
}
