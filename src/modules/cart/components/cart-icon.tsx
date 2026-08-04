import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import { getCart } from "@/src/modules/cart/actions/get-cart";

export async function CartIcon() {
  const { itemCount } = await getCart();

  return (
    <Link
      href="/cart"
      // El área tocable era antes exactamente el tamaño del ícono (20×20px,
      // sin padding): mucho menor a los ~44px mínimos recomendados para un
      // toque real (Apple/Google), y bien por debajo del size-9 (36px) que
      // ya usan el resto de los botones del header (ver MobileNav). En un
      // celular real esto se sentía como "no responde" aunque técnicamente
      // sí lo hacía al tocar el píxel exacto.
      className="relative inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      aria-label={`Carrito, ${itemCount} ${itemCount === 1 ? "producto" : "productos"}`}
    >
      <ShoppingCart className="size-5" aria-hidden />
      {itemCount > 0 && (
        <span className="absolute top-1 right-1 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </Link>
  );
}
