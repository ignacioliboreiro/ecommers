import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCents } from "@/lib/money";
import {
  getCheapestVariant,
  type ProductListItem,
} from "@/src/modules/catalog/types/catalog";

export function ProductCard({ product }: { product: ProductListItem }) {
  const cheapest = getCheapestVariant(product.variants);
  const image = product.images[0];
  const hasDiscount =
    !!cheapest?.compareAtCents && cheapest.compareAtCents > cheapest.priceCents;
  const discountPercent =
    hasDiscount && cheapest
      ? Math.round(100 - (cheapest.priceCents / cheapest.compareAtCents!) * 100)
      : 0;

  return (
    <Link href={`/products/${product.slug}`} className="block h-full">
      <Card className="h-full overflow-hidden p-0 transition-shadow hover:shadow-md">
        <div className="relative aspect-square bg-muted">
          {image ? (
            <Image
              src={image.url}
              alt={image.altText ?? product.name}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Sin imagen
            </div>
          )}
          {hasDiscount && (
            <Badge variant="destructive" className="absolute left-2 top-2">
              -{discountPercent}%
            </Badge>
          )}
        </div>
        <CardContent className="flex flex-col gap-1 p-4">
          <p className="text-xs text-muted-foreground">{product.category.name}</p>
          <h3 className="font-medium leading-snug">{product.name}</h3>
          {cheapest ? (
            <div className="flex items-baseline gap-2">
              <span className="font-semibold">{formatCents(cheapest.priceCents)}</span>
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatCents(cheapest.compareAtCents!)}
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Sin stock</span>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
