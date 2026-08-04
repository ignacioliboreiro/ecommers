import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCents } from "@/lib/money";
import { QuickAddButton } from "@/src/modules/catalog/components/quick-add-button";
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
    <div
      className={cn(
        "group animate-in fade-in slide-in-from-bottom-4 fill-mode-both relative h-full overflow-hidden rounded-2xl bg-card ring-1 ring-white/10 transition-all duration-300 ease-out hover:-translate-y-1 hover:ring-primary/40"
      )}
      style={{ animationDelay: `${delay}ms`, animationDuration: "450ms" }}
    >
      {/*
        Link "overlay" que cubre toda la card: así el quick-add de abajo puede
        vivir fuera del <a> (un <button> anidado en un <a> es HTML inválido y
        complica el click-to-navigate) sin dejar de poder navegar tocando
        cualquier otra parte de la card. El popover del quick-add igual se
        ve completo porque se renderiza en un portal, fuera de este
        `overflow-hidden`.
      */}
      <Link
        href={`/products/${product.slug}`}
        aria-label={product.name}
        className="absolute inset-0 z-0 rounded-2xl"
      />
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
        {/*
          Sin `backdrop-blur`: mismo motivo que el quick-add de abajo — un
          `backdrop-filter` anidado dentro de estos dos `overflow-hidden` +
          `rounded-2xl` (este wrapper y la card entera) puede no renderizar
          en hardware móvil real. Este ícono es solo decorativo y gated por
          hover, así que nunca se reportó roto, pero es la misma combinación
          exacta de clases — se corrige acá también en vez de dejar la misma
          bomba de tiempo sin usar.
        */}
        <div className="absolute right-2 bottom-2 flex size-8 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-y-0 translate-y-1">
          <ArrowUpRight className="size-4" aria-hidden />
        </div>
        {/*
          Quick-add en la esquina opuesta a la flecha de "ver detalle": no
          depende del hover (a diferencia de la flecha) porque en touch no hay
          hover, y este botón es la única forma de agregar sin entrar al
          detalle — ocultarlo detrás de un hover lo dejaría inútil en mobile.
        */}
        <QuickAddButton variants={product.variants} className="absolute left-2 bottom-2 z-10" />
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
    </div>
  );
}
