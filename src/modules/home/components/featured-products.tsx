import Link from "next/link";

import { getProducts } from "@/src/modules/catalog/actions/get-products";
import { ProductGrid } from "@/src/modules/catalog/components/product-grid";

export async function FeaturedProducts() {
  const { products } = await getProducts({ page: 1 });
  const featured = products.slice(0, 4);

  if (featured.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16">
      <div className="mb-8 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">Recién llegados</h2>
        <Link href="/products" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          Ver todo
        </Link>
      </div>

      <ProductGrid products={featured} />
    </section>
  );
}
