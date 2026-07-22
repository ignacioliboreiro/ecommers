import type { Prisma } from "@prisma/client";

export const PRODUCT_LIST_INCLUDE = {
  category: { select: { name: true, slug: true } },
  images: { orderBy: { position: "asc" as const }, take: 1 },
  variants: {
    select: { id: true, priceCents: true, compareAtCents: true, stock: true },
  },
} satisfies Prisma.ProductInclude;

export type ProductListItem = Prisma.ProductGetPayload<{
  include: typeof PRODUCT_LIST_INCLUDE;
}>;

export const PRODUCT_DETAIL_INCLUDE = {
  category: { select: { name: true, slug: true } },
  images: { orderBy: { position: "asc" as const } },
  variants: { orderBy: { priceCents: "asc" as const } },
  reviews: {
    where: { isApproved: true },
    orderBy: { createdAt: "desc" as const },
    include: { user: { select: { name: true } } },
  },
} satisfies Prisma.ProductInclude;

export type ProductDetail = Prisma.ProductGetPayload<{
  include: typeof PRODUCT_DETAIL_INCLUDE;
}>;

export type ProductVariantSummary = ProductListItem["variants"][number];
export type ProductVariantDetail = ProductDetail["variants"][number];
export type ProductImageItem = ProductDetail["images"][number];
export type ProductReview = ProductDetail["reviews"][number];
export type CategoryNavItem = { id: string; name: string; slug: string };

/** El JSON de `ProductVariant.attributes` es siempre un objeto plano string -> string (ej: { talle: "M", color: "azul" }). */
export type VariantAttributes = Record<string, string>;

export function toVariantAttributes(json: Prisma.JsonValue): VariantAttributes {
  if (json && typeof json === "object" && !Array.isArray(json)) {
    return json as VariantAttributes;
  }
  return {};
}

// Entre las variantes con el precio más bajo, prefiere una con descuento
// (si hay empate, mostrar el precio tachado es más útil que ocultarlo).
export function getCheapestVariant<
  T extends { priceCents: number; compareAtCents: number | null },
>(variants: T[]): T | undefined {
  if (variants.length === 0) return undefined;

  const minPrice = Math.min(...variants.map((v) => v.priceCents));
  const cheapest = variants.filter((v) => v.priceCents === minPrice);

  return (
    cheapest.find((v) => !!v.compareAtCents && v.compareAtCents > v.priceCents) ??
    cheapest[0]
  );
}
