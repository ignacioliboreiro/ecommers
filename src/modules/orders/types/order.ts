import type { Prisma } from "@prisma/client";

export const ORDER_INCLUDE = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          images: { orderBy: { position: "asc" as const }, take: 1 },
        },
      },
      variant: {
        select: {
          id: true,
          sku: true,
          attributes: true,
        },
      },
    },
  },
} satisfies Prisma.OrderInclude;

export type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;