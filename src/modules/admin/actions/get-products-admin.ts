import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { PRODUCT_LIST_INCLUDE, type ProductListItem } from "@/src/modules/catalog/types/catalog";

import { requireAdmin } from "./require-admin";

const PAGE_SIZE = 20;

export interface GetProductsAdminParams {
  search?: string;
  categorySlug?: string;
  isActive?: boolean;
  page?: number;
}

export interface GetProductsAdminResult {
  products: ProductListItem[];
  page: number;
  pageCount: number;
  total: number;
}

export async function getProductsForAdmin({
  search,
  categorySlug,
  isActive,
  page = 1,
}: GetProductsAdminParams): Promise<GetProductsAdminResult> {
  await requireAdmin();

  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;

  const where: Prisma.ProductWhereInput = {
    ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
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

export async function getProductForAdmin(productId: string) {
  await requireAdmin();

  return prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: { sku: "asc" } },
    },
  });
}
