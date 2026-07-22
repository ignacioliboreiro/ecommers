import type { Metadata } from "next";

import { getCategories } from "@/src/modules/catalog/actions/get-categories";
import { getProducts } from "@/src/modules/catalog/actions/get-products";
import { Pagination } from "@/src/modules/catalog/components/pagination";
import { ProductGrid } from "@/src/modules/catalog/components/product-grid";

export const metadata: Metadata = {
  title: "Productos",
};

interface ProductsPageProps {
  searchParams: Promise<{ category?: string; page?: string }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { category, page: pageParam } = await searchParams;
  const page = Number.parseInt(pageParam ?? "1", 10) || 1;

  const [{ products, pageCount }, categories] = await Promise.all([
    getProducts({ categorySlug: category, page }),
    getCategories(),
  ]);

  const activeCategory = categories.find((c) => c.slug === category);

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (targetPage > 1) params.set("page", String(targetPage));
    const query = params.toString();
    return query ? `/products?${query}` : "/products";
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold">
        {activeCategory ? activeCategory.name : "Todos los productos"}
      </h1>

      {products.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          No encontramos productos{activeCategory ? " en esta categoría" : ""}.
        </p>
      ) : (
        <div className="mt-6">
          <ProductGrid products={products} />
        </div>
      )}

      <div className="mt-8">
        <Pagination page={page} pageCount={pageCount} buildHref={buildHref} />
      </div>
    </div>
  );
}
