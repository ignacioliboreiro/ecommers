import "server-only";

import type { OrderStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { ORDER_INCLUDE, type OrderWithItems } from "@/src/modules/orders/types/order";

import { requireAdmin } from "./require-admin";

const PAGE_SIZE = 20;

export interface GetOrdersAdminParams {
  status?: OrderStatus;
  search?: string;
  page?: number;
}

export interface GetOrdersAdminResult {
  orders: OrderWithItems[];
  page: number;
  pageCount: number;
  total: number;
}

// A diferencia de getOrderForUser/getOrdersForUser (deliberadamente scoped a
// un userId, ver src/modules/orders/actions/get-order.ts), estas funciones
// no filtran por dueño — son solo para el panel admin.
export async function getOrdersForAdmin({
  status,
  search,
  page = 1,
}: GetOrdersAdminParams): Promise<GetOrdersAdminResult> {
  await requireAdmin();

  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;

  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { id: { equals: search } },
            { contactEmail: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: ORDER_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    page: safePage,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    total,
  };
}

export async function getOrderForAdmin(orderId: string): Promise<OrderWithItems | null> {
  await requireAdmin();

  return prisma.order.findUnique({
    where: { id: orderId },
    include: ORDER_INCLUDE,
  });
}

export async function getOrderStatusHistory(orderId: string) {
  await requireAdmin();

  return prisma.orderStatusChange.findMany({
    where: { orderId },
    orderBy: { createdAt: "desc" },
    include: { changedBy: { select: { name: true, email: true } } },
  });
}
