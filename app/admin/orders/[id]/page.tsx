import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getOrderForAdmin, getOrderStatusHistory } from "@/src/modules/admin/actions/get-orders-admin";
import { OrderStatusForm } from "@/src/modules/admin/components/order-status-form";
import { OrderDetailContent } from "@/src/modules/orders/components/order-detail-content";
import { OrderStatusBadge } from "@/src/modules/orders/components/order-status-badge";

const dateFormatter = new Intl.DateTimeFormat("es-AR", { dateStyle: "long", timeStyle: "short" });

export const metadata: Metadata = {
  title: "Detalle de pedido — Admin",
};

interface AdminOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const { id } = await params;
  const [order, history] = await Promise.all([getOrderForAdmin(id), getOrderStatusHistory(id)]);

  if (!order) notFound();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Pedido #{order.id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-sm text-muted-foreground">{dateFormatter.format(order.createdAt)}</p>
          <p className="text-sm text-muted-foreground">{order.contactEmail ?? "Sin contacto"}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <OrderStatusForm orderId={order.id} currentStatus={order.status} />

      <OrderDetailContent order={order} />

      <section className="rounded-lg border border-border p-4">
        <h2 className="mb-4 text-lg font-medium">Historial de cambios</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin cambios manuales todavía.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((change) => (
              <div key={change.id} className="border-b border-border pb-3 text-sm last:border-0">
                <p>
                  <span className="font-medium">{change.fromStatus}</span> →{" "}
                  <span className="font-medium">{change.toStatus}</span>
                </p>
                <p className="text-muted-foreground">
                  {change.changedBy.name ?? change.changedBy.email} ·{" "}
                  {dateFormatter.format(change.createdAt)}
                </p>
                {change.note && <p className="mt-1 text-muted-foreground">{change.note}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
