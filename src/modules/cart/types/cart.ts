import type { Prisma } from "@prisma/client";
import * as z from "zod";

import { toVariantAttributes, type VariantAttributes } from "@/src/modules/catalog/types/catalog";

export const CART_INCLUDE = {
  items: {
    orderBy: { id: "asc" as const },
    include: {
      variant: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: { orderBy: { position: "asc" as const }, take: 1 },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

export type CartWithItems = Prisma.CartGetPayload<{ include: typeof CART_INCLUDE }>;
export type CartItemWithVariant = CartWithItems["items"][number];

export interface CartLineItem {
  id: string;
  variantId: string;
  productName: string;
  productSlug: string;
  imageUrl: string | null;
  attributes: VariantAttributes;
  quantity: number;
  unitPriceCents: number;
  stock: number;
  lineSubtotalCents: number;
}

export interface CartSummary {
  cartId: string | null;
  items: CartLineItem[];
  itemCount: number;
  subtotalCents: number;
}

export const EMPTY_CART_SUMMARY: CartSummary = {
  cartId: null,
  items: [],
  itemCount: 0,
  subtotalCents: 0,
};

export function toCartSummary(cart: CartWithItems | null): CartSummary {
  if (!cart) return EMPTY_CART_SUMMARY;

  const items: CartLineItem[] = cart.items.map((item) => {
    const unitPriceCents = item.variant.priceCents;
    return {
      id: item.id,
      variantId: item.variantId,
      productName: item.variant.product.name,
      productSlug: item.variant.product.slug,
      imageUrl: item.variant.product.images[0]?.url ?? null,
      attributes: toVariantAttributes(item.variant.attributes),
      quantity: item.quantity,
      unitPriceCents,
      stock: item.variant.stock,
      lineSubtotalCents: unitPriceCents * item.quantity,
    };
  });

  return {
    cartId: cart.id,
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotalCents: items.reduce((sum, item) => sum + item.lineSubtotalCents, 0),
  };
}

// ---------- Validación de inputs de las server actions ----------

export const AddItemSchema = z.object({
  variantId: z.string().min(1, { error: "Falta seleccionar un producto." }),
  quantity: z.coerce
    .number({ error: "Cantidad inválida." })
    .int({ error: "La cantidad debe ser un número entero." })
    .positive({ error: "La cantidad debe ser mayor a 0." }),
});

export const UpdateQuantitySchema = z.object({
  itemId: z.string().min(1, { error: "Falta el producto del carrito." }),
  quantity: z.coerce
    .number({ error: "Cantidad inválida." })
    .int({ error: "La cantidad debe ser un número entero." })
    .positive({ error: "La cantidad debe ser mayor a 0." }),
});

export const RemoveItemSchema = z.object({
  itemId: z.string().min(1, { error: "Falta el producto del carrito." }),
});

export type CartActionState =
  | { status: "success"; message: string }
  | { status: "error"; message: string }
  | undefined;
