import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getProductForAdmin } from "@/src/modules/admin/actions/get-products-admin";
import { ProductForm } from "@/src/modules/admin/components/product-form";
import { toVariantAttributes } from "@/src/modules/catalog/types/catalog";
import { getCategories } from "@/src/modules/catalog/actions/get-categories";

export const metadata: Metadata = {
  title: "Editar producto — Admin",
};

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const [product, categories] = await Promise.all([getProductForAdmin(id), getCategories()]);

  if (!product) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Editar producto</h1>
      <ProductForm
        categories={categories}
        initialValues={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          categoryId: product.categoryId,
          isActive: product.isActive,
          images: product.images.map((img) => ({ url: img.url, altText: img.altText })),
          variants: product.variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            priceCents: v.priceCents,
            compareAtCents: v.compareAtCents,
            stock: v.stock,
            lowStockAlert: v.lowStockAlert,
            attributes: toVariantAttributes(v.attributes),
          })),
        }}
      />
    </div>
  );
}
