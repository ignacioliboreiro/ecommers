import type { Metadata } from "next";

import { getCategories } from "@/src/modules/catalog/actions/get-categories";
import { ProductForm } from "@/src/modules/admin/components/product-form";

export const metadata: Metadata = {
  title: "Nuevo producto — Admin",
};

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Nuevo producto</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
