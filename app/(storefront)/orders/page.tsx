import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { formatCents } from "@/lib/money";
import { getOrdersForUser } from "@/src/modules/orders/actions/get-order";
import { Pagination } from "@/src/modules/catalog/components/pagination";
import { OrderStatusBadge } from "@/src/modules/orders/components/order-status-badge";

const dateFormatter = new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" });

export const metadata: Metadata = {
  title: "Mis pedidos",
};

interface OrdersPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { page: pageParam } = await searchParams;
  const page = Number.parseInt(pageParam ?? "1", 10) || 1;

  const { orders, pageCount } = await getOrdersForUser(session.user.id, page);

  function buildHref(targetPage: number) {
    return targetPage > 1 ? `/orders?page=${targetPage}` : "/orders";
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">Mis pedidos</h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">Todavía no hiciste ningún pedido.</p>
          <Link href="/products" className="text-sm font-medium underline">
            Ver productos
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {orders.map((order) => {
            const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium">
                    Pedido #{order.id.slice(-8).toUpperCase()}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {dateFormatter.format(order.createdAt)} · {itemCount}{" "}
                    {itemCount === 1 ? "producto" : "productos"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium tabular-nums">
                    {formatCents(order.totalCents)}
                  </span>
                  <OrderStatusBadge status={order.status} />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-10">
        <Pagination page={page} pageCount={pageCount} buildHref={buildHref} />
      </div>
    </div>
  );
}
