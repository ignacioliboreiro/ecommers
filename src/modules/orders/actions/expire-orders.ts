"use server";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Libera el stock reservado de una o más órdenes: crea un StockMovement
 * ADJUSTMENT por cada item y devuelve el stock a ProductVariant agrupado
 * por variante (por si varias órdenes comparten la misma). Compartido por
 * expireOldOrders() (batch, cron) y updateOrderStatus() (manual, admin) —
 * es la misma operación de negocio en ambos casos, solo cambia quién y por
 * qué la dispara.
 */
export async function restoreStockForOrder(
  tx: Prisma.TransactionClient,
  orderIds: string[],
  reason: string
): Promise<void> {
  if (orderIds.length === 0) return;

  const orderItems = await tx.orderItem.findMany({
    where: { orderId: { in: orderIds } },
    include: { variant: true },
  });

  const stockRestorations = orderItems.map((item) => ({
    variantId: item.variantId,
    type: "ADJUSTMENT" as const,
    quantity: item.quantity, // positive = adding back to stock
    note: `Order ${item.orderId} ${reason}, stock restored`,
  }));

  await tx.stockMovement.createMany({ data: stockRestorations });

  const quantityByVariant = new Map<string, number>();
  for (const item of orderItems) {
    quantityByVariant.set(
      item.variantId,
      (quantityByVariant.get(item.variantId) ?? 0) + item.quantity
    );
  }
  for (const [variantId, quantity] of quantityByVariant) {
    await tx.productVariant.update({
      where: { id: variantId },
      data: { stock: { increment: quantity } },
    });
  }
}

/**
 * Expire orders that have been in PENDING_PAYMENT state for too long
 * Returns the number of orders that were expired
 */
export async function expireOldOrders(): Promise<number> {
  // Find orders that are still in PENDING_PAYMENT state and older than 1 hour
  const expiredOrders = await prisma.order.findMany({
    where: {
      status: "PENDING_PAYMENT",
      expiresAt: {
        lt: new Date(), // expiresAt is in the past
      },
    },
    select: {
      id: true,
    },
  });

  if (expiredOrders.length === 0) {
    return 0;
  }

  const expiredOrderIds = expiredOrders.map((order) => order.id);

  const result = await prisma.$transaction(async (tx) => {
    await tx.order.updateMany({
      where: { id: { in: expiredOrderIds } },
      data: { status: "EXPIRED" },
    });

    await restoreStockForOrder(tx, expiredOrderIds, "expired");

    return expiredOrderIds.length;
  });

  return result;
}
