import type { Metadata } from "next";
import type { OrderStatus } from "@prisma/client";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents } from "@/lib/money";
import { getDashboardMetrics } from "@/src/modules/admin/actions/dashboard";
import { OrderStatusBadge } from "@/src/modules/orders/components/order-status-badge";

export const metadata: Metadata = {
  title: "Dashboard admin",
};

export default async function AdminDashboardPage() {
  const { totalSalesCents, ordersByStatus, lowStockVariants } = await getDashboardMetrics();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ventas totales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{formatCents(totalSalesCents)}</p>
            <p className="text-sm text-muted-foreground">Órdenes pagadas o despachadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Productos con stock bajo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{lowStockVariants.length}</p>
            <p className="text-sm text-muted-foreground">Variantes en o bajo su alerta</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos por estado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Object.entries(ordersByStatus).map(([status, count]) => (
              <div key={status} className="flex flex-col gap-2 rounded-md border border-border p-3">
                <OrderStatusBadge status={status as OrderStatus} />
                <span className="text-2xl font-semibold tabular-nums">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-destructive" aria-hidden />
            Stock bajo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lowStockVariants.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ninguna variante está por debajo de su alerta de stock.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {lowStockVariants.map((v) => (
                <div key={v.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <Link
                      href={`/admin/products/${v.productId}/edit`}
                      className="font-medium hover:underline"
                    >
                      {v.productName}
                    </Link>
                    <span className="ml-2 text-muted-foreground">{v.sku}</span>
                  </div>
                  <span className="tabular-nums text-destructive">
                    {v.stock} / {v.lowStockAlert}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
