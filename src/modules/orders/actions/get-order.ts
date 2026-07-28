import "server-only";

import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { ORDER_INCLUDE, type OrderWithItems } from "@/src/modules/orders/types/order";

const PAGE_SIZE = 10;

/**
 * Busca una orden filtrando por dueño en el mismo `where` — si la orden
 * existe pero es de otro usuario, esto devuelve null igual que si no
 * existiera. Así el caller nunca puede distinguir "no existe" de "no es
 * tuya" (evita revelar existencia de órdenes ajenas).
 */
export const getOrderForUser = cache(
  async (orderId: string, userId: string): Promise<OrderWithItems | null> => {
    return prisma.order.findFirst({
      where: { id: orderId, userId },
      include: ORDER_INCLUDE,
    });
  }
);

export interface GetOrdersForUserResult {
  orders: OrderWithItems[];
  page: number;
  pageCount: number;
  total: number;
}

export async function getOrdersForUser(
  userId: string,
  page = 1
): Promise<GetOrdersForUserResult> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.order.count({ where: { userId } }),
  ]);

  return {
    orders,
    page: safePage,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    total,
  };
}
