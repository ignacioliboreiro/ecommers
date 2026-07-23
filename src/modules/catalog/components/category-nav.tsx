import Link from "next/link";

import { getCategories } from "@/src/modules/catalog/actions/get-categories";
import { CartIcon } from "@/src/modules/cart/components/cart-icon";

export async function CategoryNav() {
  const categories = await getCategories();

  return (
    <header className="border-b">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3 text-sm">
        <Link href="/" className="font-semibold">
          Tienda
        </Link>
        <Link href="/products" className="text-muted-foreground hover:text-foreground">
          Todos
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/products?category=${category.slug}`}
            className="text-muted-foreground hover:text-foreground"
          >
            {category.name}
          </Link>
        ))}
        <div className="ml-auto flex items-center gap-4">
          <Link href="/login" className="text-muted-foreground hover:text-foreground">
            Ingresar
          </Link>
          <CartIcon />
        </div>
      </nav>
    </header>
  );
}
