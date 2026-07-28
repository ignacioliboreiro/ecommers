"use server";

import { prisma } from "@/lib/prisma";

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

  // Update expired orders to EXPIRED status and restore stock
  const expiredOrderIds = expiredOrders.map((order) => order.id);

  const result = await prisma.$transaction(async (tx) => {
    // Update order status to EXPIRED
    await tx.order.updateMany({
      where: {
        id: {
          in: expiredOrderIds,
        },
      },
      data: {
        status: "EXPIRED",
      },
    });

    // Restore stock for expired orders
    const orderItems = await tx.orderItem.findMany({
      where: {
        orderId: {
          in: expiredOrderIds,
        },
      },
      include: {
        variant: true,
      },
    });

    // Create stock movements to restore inventory (positive quantity = stock coming in)
    const stockRestorations = orderItems.map((item) => ({
      variantId: item.variantId,
      type: "ADJUSTMENT" as const, // Using ADJUSTMENT for stock restoration
      quantity: item.quantity, // positive = adding back to stock
      note: `Order ${item.orderId} expired, stock restored`,
    }));

    await tx.stockMovement.createMany({
      data: stockRestorations,
    });

    // Devolver el stock reservado: agrupar por variante por si varias
    // órdenes expiradas comparten la misma variante.
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

    return expiredOrderIds.length;
  });

  return result;
}