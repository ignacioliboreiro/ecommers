import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

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
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/products" className="hover:text-foreground">
          Productos
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <Link
          href={`/products?category=${product.category.slug}`}
          className="hover:text-foreground"
        >
          {product.category.name}
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} productName={product.name} />

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">{product.category.name}</p>
            <h1 className="text-3xl font-semibold tracking-tight">{product.name}</h1>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>
          <div className="border-t border-border pt-5">
            <ProductOptions variants={product.variants} />
          </div>
        </div>
      </div>

      <section className="mt-16 max-w-2xl">
        <h2 className="text-lg font-semibold">Reseñas</h2>
        <div className="mt-4">
          <ReviewList reviews={product.reviews} />
        </div>
      </section>
    </div>
  );
}
