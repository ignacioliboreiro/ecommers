"use client";

import { Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useActionState, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/money";
import { addItem } from "@/src/modules/cart/actions/mutations";
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
  const [state, formAction, pending] = useActionState(addItem, undefined);

  const activeVariant = parsedVariants.find(({ attrs }) =>
    attributeKeys.every((key) => attrs[key] === selected[key])
  )?.variant;

  const hasDiscount =
    !!activeVariant?.compareAtCents && activeVariant.compareAtCents > activeVariant.priceCents;

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
          <span id={`attr-label-${key}`} className="text-sm font-medium">
            {capitalize(key)}
          </span>
          <div
            role="group"
            aria-labelledby={`attr-label-${key}`}
            className="flex flex-wrap gap-2"
          >
            {attributeValues.get(key)?.map((value) => {
              const isSelected = selected[key] === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelected((prev) => ({ ...prev, [key]: value }))}
                  aria-pressed={isSelected}
                  className={`relative overflow-hidden rounded-md border px-3 py-1.5 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                    isSelected
                      ? "border-primary text-primary-foreground"
                      : "border-input text-foreground hover:border-foreground/40"
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId={`pill-${key}`}
                      className="absolute inset-0 rounded-md bg-primary"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative">{value}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeVariant?.id ?? "unavailable"}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="flex flex-col gap-1"
        >
          {activeVariant ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold tabular-nums">
                  {formatCents(activeVariant.priceCents)}
                </span>
                {hasDiscount && (
                  <span className="text-muted-foreground line-through tabular-nums">
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
        </motion.div>
      </AnimatePresence>

      <form action={formAction} className="flex flex-col gap-2">
        <input type="hidden" name="variantId" value={activeVariant?.id ?? ""} />
        <input type="hidden" name="quantity" value="1" />
        <Button
          type="submit"
          disabled={pending || !activeVariant || activeVariant.stock <= 0}
          className="w-full sm:w-auto"
        >
          {pending ? "Agregando…" : "Agregar al carrito"}
        </Button>
        <AnimatePresence>
          {state?.status === "error" && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm text-destructive"
              role="alert"
            >
              {state.message}
            </motion.p>
          )}
          {state?.status === "success" && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-sm text-green-500"
              role="status"
            >
              <Check className="size-4" aria-hidden />
              {state.message}
            </motion.p>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
