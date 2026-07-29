import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCents } from "@/lib/money";
import {
  getCheapestVariant,
  type ProductListItem,
} from "@/src/modules/catalog/types/catalog";

export function ProductCard({
  product,
  index = 0,
}: {
  product: ProductListItem;
  index?: number;
}) {
  const cheapest = getCheapestVariant(product.variants);
  const image = product.images[0];
  const hasDiscount =
    !!cheapest?.compareAtCents && cheapest.compareAtCents > cheapest.priceCents;
  const discountPercent =
    hasDiscount && cheapest
      ? Math.round(100 - (cheapest.priceCents / cheapest.compareAtCents!) * 100)
      : 0;
  const delay = Math.min(index, 7) * 60;

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        "group animate-in fade-in slide-in-from-bottom-4 fill-mode-both block h-full overflow-hidden rounded-2xl bg-card ring-1 ring-white/10 transition-all duration-300 ease-out hover:-translate-y-1 hover:ring-primary/40"
      )}
      style={{ animationDelay: `${delay}ms`, animationDuration: "450ms" }}
    >
      <div className="relative aspect-square overflow-hidden rounded-t-2xl bg-muted">
        {image ? (
          <Image
            src={image.url}
            alt={image.altText ?? product.name}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
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
        <div className="absolute right-2 bottom-2 flex size-8 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 backdrop-blur transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-y-0 translate-y-1">
          <ArrowUpRight className="size-4" aria-hidden />
        </div>
      </div>
      <div className="flex flex-col gap-1 p-4">
        <p className="text-xs text-muted-foreground">{product.category.name}</p>
        <h3 className="font-medium leading-snug">{product.name}</h3>
        {cheapest ? (
          <div className="flex items-baseline gap-2">
            <span className="font-semibold tabular-nums">{formatCents(cheapest.priceCents)}</span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through tabular-nums">
                {formatCents(cheapest.compareAtCents!)}
              </span>
            )}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Sin stock</span>
        )}
      </div>
    </Link>
  );
}
