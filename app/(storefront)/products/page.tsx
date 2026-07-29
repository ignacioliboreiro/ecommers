import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
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
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="animate-in fade-in slide-in-from-bottom-2 mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {activeCategory ? activeCategory.name : "Todos los productos"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {activeCategory
            ? `Explorá lo mejor en ${activeCategory.name.toLowerCase()}.`
            : "Smartphones, notebooks, audio, wearables, gaming y cámaras."}
        </p>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <CategoryChip href="/products" active={!activeCategory}>
          Todos
        </CategoryChip>
        {categories.map((c) => (
          <CategoryChip key={c.id} href={`/products?category=${c.slug}`} active={c.slug === category}>
            {c.name}
          </CategoryChip>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No encontramos productos{activeCategory ? " en esta categoría" : ""}.
          </p>
        </div>
      ) : (
        <ProductGrid products={products} />
      )}

      <div className="mt-10">
        <Pagination page={page} pageCount={pageCount} buildHref={buildHref} />
      </div>
    </div>
  );
}

function CategoryChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}
