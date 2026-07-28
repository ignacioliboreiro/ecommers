import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCents } from "@/lib/money";
import { getCategories } from "@/src/modules/catalog/actions/get-categories";
import { getCheapestVariant } from "@/src/modules/catalog/types/catalog";
import { getProductsForAdmin } from "@/src/modules/admin/actions/get-products-admin";
import { Pagination } from "@/src/modules/catalog/components/pagination";
import { ProductActiveToggle } from "@/src/modules/admin/components/product-active-toggle";

export const metadata: Metadata = {
  title: "Productos — Admin",
};

interface AdminProductsPageProps {
  searchParams: Promise<{ search?: string; category?: string; isActive?: string; page?: string }>;
}

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const { search, category, isActive, page: pageParam } = await searchParams;
  const page = Number.parseInt(pageParam ?? "1", 10) || 1;

  const [{ products, pageCount }, categories] = await Promise.all([
    getProductsForAdmin({
      search,
      categorySlug: category,
      isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
      page,
    }),
    getCategories(),
  ]);

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (isActive) params.set("isActive", isActive);
    if (targetPage > 1) params.set("page", String(targetPage));
    const query = params.toString();
    return query ? `/admin/products?${query}` : "/admin/products";
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Productos</h1>
        <Button render={<Link href="/admin/products/new" />} nativeButton={false}>
          <Plus data-icon="inline-start" aria-hidden />
          Nuevo producto
        </Button>
      </div>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="search" className="text-sm font-medium">
            Buscar
          </label>
          <Input
            id="search"
            name="search"
            defaultValue={search}
            placeholder="Nombre del producto..."
            className="max-w-xs"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="category" className="text-sm font-medium">
            Categoría
          </label>
          <select
            id="category"
            name="category"
            defaultValue={category ?? ""}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="isActive" className="text-sm font-medium">
            Estado
          </label>
          <select
            id="isActive"
            name="isActive"
            defaultValue={isActive ?? ""}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <option value="">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>
        <Button type="submit" variant="outline">
          Filtrar
        </Button>
      </form>

      {products.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No se encontraron productos con esos filtros.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Activo</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const cheapest = getCheapestVariant(product.variants);
              const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
              return (
                <TableRow key={product.id}>
                  <TableCell className="max-w-[240px] truncate font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">{product.category.name}</TableCell>
                  <TableCell className="tabular-nums">
                    {cheapest ? formatCents(cheapest.priceCents) : "—"}
                  </TableCell>
                  <TableCell className="tabular-nums">{totalStock}</TableCell>
                  <TableCell>
                    <ProductActiveToggle productId={product.id} isActive={product.isActive} />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="text-sm font-medium underline"
                    >
                      Editar
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <Pagination page={page} pageCount={pageCount} buildHref={buildHref} />
    </div>
  );
}
