"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/money";
import { removeItem, updateQuantity } from "@/src/modules/cart/actions/mutations";
import type { CartLineItem } from "@/src/modules/cart/types/cart";

function attributesLabel(attributes: Record<string, string>): string {
  return Object.entries(attributes)
    .map(([key, value]) => `${key}: ${value}`)
    .join(" · ");
}

export function CartItemRow({ item }: { item: CartLineItem }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function changeQuantity(nextQuantity: number) {
    if (nextQuantity < 1) return;
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("itemId", item.id);
      fd.set("quantity", String(nextQuantity));
      const result = await updateQuantity(undefined, fd);
      if (result?.status === "error") setError(result.message);
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("itemId", item.id);
      const result = await removeItem(undefined, fd);
      if (result?.status === "error") setError(result.message);
    });
  }

  const label = attributesLabel(item.attributes);
  const atMax = item.quantity >= item.stock;

  return (
    <div className="flex gap-4 py-4">
      <Link
        href={`/products/${item.productSlug}`}
        className="relative size-20 shrink-0 overflow-hidden rounded-md bg-muted"
      >
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.productName}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-1">
        <Link href={`/products/${item.productSlug}`} className="font-medium hover:underline">
          {item.productName}
        </Link>
        {label && <p className="text-xs text-muted-foreground">{label}</p>}
        <p className="text-sm text-muted-foreground tabular-nums">
          {formatCents(item.unitPriceCents)} c/u
        </p>

        <div className="mt-1 flex items-center gap-2">
          <div className="flex items-center rounded-md border border-input">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={pending || item.quantity <= 1}
              onClick={() => changeQuantity(item.quantity - 1)}
              aria-label="Disminuir cantidad"
            >
              <Minus aria-hidden />
            </Button>
            <span className="min-w-8 text-center text-sm" aria-live="polite">
              {item.quantity}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={pending || atMax}
              onClick={() => changeQuantity(item.quantity + 1)}
              aria-label="Aumentar cantidad"
            >
              <Plus aria-hidden />
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={pending}
            onClick={remove}
            aria-label={`Eliminar ${item.productName} del carrito`}
          >
            <Trash2 aria-hidden />
          </Button>
        </div>

        {atMax && (
          <p className="text-xs text-muted-foreground">Alcanzaste el stock disponible.</p>
        )}
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="text-right font-medium tabular-nums">
        {formatCents(item.lineSubtotalCents)}
      </div>
    </div>
  );
}
