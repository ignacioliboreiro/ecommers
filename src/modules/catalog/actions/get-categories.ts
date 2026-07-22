import "server-only";

import { prisma } from "@/lib/prisma";
import type { CategoryNavItem } from "@/src/modules/catalog/types/catalog";

// Sin caché: se consulta directo a la DB en cada request (navbar).
export async function getCategories(): Promise<CategoryNavItem[]> {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}
