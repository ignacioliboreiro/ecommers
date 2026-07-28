import "server-only";

import type { OrderStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { requireAdmin } from "./require-admin";

export interface LowStockVariant {
  id: string;
  sku: string;
  stock: number;
  lowStockAlert: number;
  productId: string;
  productName: string;
}

export interface DashboardMetrics {
  totalSalesCents: number;
  ordersByStatus: Record<OrderStatus, number>;
  lowStockVariants: LowStockVariant[];
}

const ALL_STATUSES: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PROCESSING",
  "PAID",
  "FULFILLED",
  "CANCELLED",
  "REFUNDED",
  "EXPIRED",
];

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  await requireAdmin();

  const [salesAgg, statusGroups, variants] = await Promise.all([
    // "Ventas totales" = dinero cobrado realmente: PAID + FULFILLED (una
    // orden despachada sigue siendo una venta, no deja de contar).
    prisma.order.aggregate({
      where: { status: { in: ["PAID", "FULFILLED"] } },
      _sum: { totalCents: true },
    }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
    prisma.productVariant.findMany({
      select: {
        id: true,
        sku: true,
        stock: true,
        lowStockAlert: true,
        productId: true,
        product: { select: { name: true } },
      },
    }),
  ]);

  const ordersByStatus = Object.fromEntries(
    ALL_STATUSES.map((status) => [status, 0])
  ) as Record<OrderStatus, number>;
  for (const group of statusGroups) {
    ordersByStatus[group.status] = group._count;
  }

  const lowStockVariants: LowStockVariant[] = variants
    .filter((v) => v.stock <= v.lowStockAlert)
    .map((v) => ({
      id: v.id,
      sku: v.sku,
      stock: v.stock,
      lowStockAlert: v.lowStockAlert,
      productId: v.productId,
      productName: v.product.name,
    }))
    .sort((a, b) => a.stock - b.stock);

  return {
    totalSalesCents: salesAgg._sum.totalCents ?? 0,
    ordersByStatus,
    lowStockVariants,
  };
}
