"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/money";
import {
  toVariantAttributes,
  type ProductVariantDetail,
} from "@/src/modules/catalog/types/catalog";

// Prioridad de orden para atributos conocidos; cualquier otro atributo
// (el selector no asume que siempre es talle/color) va después, alfabético.
const ATTRIBUTE_KEY_PRIORITY = ["talle", "size", "color", "material"];

function sortAttributeKeys(keys: string[]): string[] {
  return [...keys].sort((a, b) => {
    const rankA = ATTRIBUTE_KEY_PRIORITY.indexOf(a.toLowerCase());
    const rankB = ATTRIBUTE_KEY_PRIORITY.indexOf(b.toLowerCase());
    if (rankA === -1 && rankB === -1) return a.localeCompare(b);
    if (rankA === -1) return 1;
    if (rankB === -1) return -1;
    return rankA - rankB;
  });
}

function capitalize(value: string): string {
  return value.length ? value[0].toUpperCase() + value.slice(1) : value;
}

interface ProductOptionsProps {
  variants: ProductVariantDetail[];
}

export function ProductOptions({ variants }: ProductOptionsProps) {
  const parsedVariants = useMemo(
    () =>
      variants.map((variant) => ({
        variant,
        attrs: toVariantAttributes(variant.attributes),
      })),
    [variants]
  );

  const attributeKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const { attrs } of parsedVariants) {
      Object.keys(attrs).forEach((key) => keys.add(key));
    }
    return sortAttributeKeys([...keys]);
  }, [parsedVariants]);

  const attributeValues = useMemo(() => {
    const values = new Map<string, string[]>();
    for (const key of attributeKeys) {
      const seen = new Set<string>();
      for (const { attrs } of parsedVariants) {
        if (attrs[key]) seen.add(attrs[key]);
      }
      values.set(key, [...seen]);
    }
    return values;
  }, [attributeKeys, parsedVariants]);

  const [selected, setSelected] = useState<Record<string, string>>(
    () => parsedVariants[0]?.attrs ?? {}
  );

  const activeVariant = parsedVariants.find(({ attrs }) =>
    attributeKeys.every((key) => attrs[key] === selected[key])
  )?.variant;

  const hasDiscount =
    !!activeVariant?.compareAtCents && activeVariant.compareAtCents > activeVariant.priceCents;

  function handleAddToCart() {
    if (!activeVariant) return;
    // El carrito real se implementa en la próxima fase.
    console.log("Agregar al carrito", {
      variantId: activeVariant.id,
      sku: activeVariant.sku,
      quantity: 1,
    });
  }

  if (parsedVariants.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Este producto no tiene variantes disponibles.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {attributeKeys.map((key) => (
        <div key={key} className="flex flex-col gap-2">
          <span className="text-sm font-medium">{capitalize(key)}</span>
          <div className="flex flex-wrap gap-2">
            {attributeValues.get(key)?.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setSelected((prev) => ({ ...prev, [key]: value }))}
                aria-pressed={selected[key] === value}
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  selected[key] === value
                    ? "border-foreground bg-foreground text-background"
                    : "border-input hover:border-foreground"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="flex flex-col gap-1">
        {activeVariant ? (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold">
                {formatCents(activeVariant.priceCents)}
              </span>
              {hasDiscount && (
                <span className="text-muted-foreground line-through">
                  {formatCents(activeVariant.compareAtCents!)}
                </span>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {activeVariant.stock > 0
                ? `${activeVariant.stock} unidades disponibles`
                : "Sin stock"}
            </span>
          </>
        ) : (
          <span className="text-sm text-destructive">
            Esta combinación no está disponible.
          </span>
        )}
      </div>

      <Button
        onClick={handleAddToCart}
        disabled={!activeVariant || activeVariant.stock <= 0}
        className="w-full sm:w-auto"
      >
        Agregar al carrito
      </Button>
    </div>
  );
}
