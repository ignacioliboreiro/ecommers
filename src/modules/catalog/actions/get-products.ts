import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { PRODUCT_LIST_INCLUDE, type ProductListItem } from "@/src/modules/catalog/types/catalog";

const PAGE_SIZE = 12;

export interface GetProductsParams {
  categorySlug?: string;
  page?: number;
}

export interface GetProductsResult {
  products: ProductListItem[];
  page: number;
  pageCount: number;
  total: number;
}

export async function getProducts({
  categorySlug,
  page = 1,
}: GetProductsParams): Promise<GetProductsResult> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: PRODUCT_LIST_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    page: safePage,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    total,
  };
}
