import "server-only";

import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { PRODUCT_DETAIL_INCLUDE } from "@/src/modules/catalog/types/catalog";

// cache() dedupea la consulta dentro de un mismo request (page + generateMetadata piden el mismo slug).
export const getProductBySlug = cache(async (slug: string) => {
  return prisma.product.findFirst({
    where: { slug, isActive: true },
    include: PRODUCT_DETAIL_INCLUDE,
  });
});
