"use server";

import type { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { restoreStockForOrder } from "@/src/modules/orders/actions/expire-orders";

import { requireAdmin } from "./require-admin";

export interface UpdateOrderStatusResult {
  status: "success" | "error";
  message: string;
}

const VALID_STATUSES: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PROCESSING",
  "PAID",
  "FULFILLED",
  "CANCELLED",
  "REFUNDED",
  "EXPIRED",
];

export async function updateOrderStatus(
  _prev: UpdateOrderStatusResult | undefined,
  formData: FormData
): Promise<UpdateOrderStatusResult> {
  const admin = await requireAdmin();

  const orderId = String(formData.get("orderId") ?? "");
  const toStatus = String(formData.get("status") ?? "") as OrderStatus;
  const note = String(formData.get("note") ?? "").trim();

  if (!orderId || !VALID_STATUSES.includes(toStatus)) {
    return { status: "error", message: "Datos inválidos." };
  }

  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
  if (!order) return { status: "error", message: "Orden no encontrada." };

  if (order.status === toStatus) {
    return { status: "error", message: "La orden ya está en ese estado." };
  }

  await prisma.$transaction(async (tx) => {
    if (toStatus === "CANCELLED") {
      await restoreStockForOrder(tx, [orderId], "cancelled by admin");
    }

    await tx.order.update({ where: { id: orderId }, data: { status: toStatus } });

    await tx.orderStatusChange.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus,
        changedByUserId: admin.id,
        note: note || null,
      },
    });
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/admin/orders");

  return { status: "success", message: `Estado actualizado a ${toStatus}.` };
}
