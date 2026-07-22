import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getProductBySlug } from "@/src/modules/catalog/actions/get-product-by-slug";
import { ProductGallery } from "@/src/modules/catalog/components/product-gallery";
import { ProductOptions } from "@/src/modules/catalog/components/product-options";
import { ReviewList } from "@/src/modules/catalog/components/review-list";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return { title: product?.name ?? "Producto no encontrado" };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery images={product.images} productName={product.name} />

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{product.category.name}</p>
            <h1 className="text-2xl font-semibold">{product.name}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{product.description}</p>
          <ProductOptions variants={product.variants} />
        </div>
      </div>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">Reseñas</h2>
        <div className="mt-4">
          <ReviewList reviews={product.reviews} />
        </div>
      </section>
    </div>
  );
}
