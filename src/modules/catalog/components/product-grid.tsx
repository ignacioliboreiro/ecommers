import { ProductCard } from "@/src/modules/catalog/components/product-card";
import type { ProductListItem } from "@/src/modules/catalog/types/catalog";

export function ProductGrid({ products }: { products: ProductListItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} index={index} />
      ))}
    </div>
  );
}
