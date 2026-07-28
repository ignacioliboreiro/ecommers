import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { getOrderForUser } from "@/src/modules/orders/actions/get-order";
import { OrderDetailContent } from "@/src/modules/orders/components/order-detail-content";
import { OrderStatusBadge } from "@/src/modules/orders/components/order-status-badge";
import { OrderStatusPoller } from "@/src/modules/orders/components/order-status-poller";

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "long",
  timeStyle: "short",
});

export const metadata: Metadata = {
  title: "Detalle de pedido",
};

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const order = await getOrderForUser(id, session.user.id);
  if (!order) notFound();

  const isPending = order.status === "PENDING_PAYMENT" || order.status === "PROCESSING";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Pedido #{order.id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-sm text-muted-foreground">
            {dateFormatter.format(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {isPending && (
        <div className="mb-8">
          <OrderStatusPoller orderId={order.id} initialStatus={order.status} />
        </div>
      )}

      <OrderDetailContent order={order} />
    </div>
  );
}
