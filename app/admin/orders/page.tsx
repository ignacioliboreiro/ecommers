import type { Metadata } from "next";
import type { OrderStatus } from "@prisma/client";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCents } from "@/lib/money";
import { getOrdersForAdmin } from "@/src/modules/admin/actions/get-orders-admin";
import { OrderStatusBadge } from "@/src/modules/orders/components/order-status-badge";
import { Pagination } from "@/src/modules/catalog/components/pagination";

export const metadata: Metadata = {
  title: "Pedidos — Admin",
};

const ALL_STATUSES: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PROCESSING",
  "PAID",
  "FULFILLED",
  "CANCELLED",
  "REFUNDED",
  "EXPIRED",
];

interface AdminOrdersPageProps {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const { status, search, page: pageParam } = await searchParams;
  const page = Number.parseInt(pageParam ?? "1", 10) || 1;

  const validStatus = ALL_STATUSES.includes(status as OrderStatus)
    ? (status as OrderStatus)
    : undefined;

  const { orders, pageCount } = await getOrdersForAdmin({ status: validStatus, search, page });

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    if (targetPage > 1) params.set("page", String(targetPage));
    const query = params.toString();
    return query ? `/admin/orders?${query}` : "/admin/orders";
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Pedidos</h1>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="search" className="text-sm font-medium">
            Buscar
          </label>
          <Input
            id="search"
            name="search"
            defaultValue={search}
            placeholder="Id o email de contacto..."
            className="max-w-xs"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className="text-sm font-medium">
            Estado
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status ?? ""}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <option value="">Todos los estados</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="outline">
          Filtrar
        </Button>
      </form>

      {orders.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No se encontraron pedidos con esos filtros.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-xs">{order.id}</TableCell>
                <TableCell className="text-muted-foreground">
                  {order.contactEmail ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Intl.DateTimeFormat("es-AR", { dateStyle: "short" }).format(order.createdAt)}
                </TableCell>
                <TableCell className="tabular-nums">{formatCents(order.totalCents)}</TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell>
                  <Link href={`/admin/orders/${order.id}`} className="text-sm font-medium underline">
                    Ver
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Pagination page={page} pageCount={pageCount} buildHref={buildHref} />
    </div>
  );
}
