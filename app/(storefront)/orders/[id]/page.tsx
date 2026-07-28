import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { formatCents } from "@/lib/money";
import { toVariantAttributes } from "@/src/modules/catalog/types/catalog";
import { getOrderForUser } from "@/src/modules/orders/actions/get-order";
import { OrderStatusBadge } from "@/src/modules/orders/components/order-status-badge";
import { OrderStatusPoller } from "@/src/modules/orders/components/order-status-poller";

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "long",
  timeStyle: "short",
});

function attributesLabel(attributes: Record<string, string>): string {
  return Object.entries(attributes)
    .map(([key, value]) => `${key}: ${value}`)
    .join(" · ");
}

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

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-medium">Productos</h2>
        <div className="divide-y divide-border rounded-lg border border-border">
          {order.items.map((item) => {
            const attrs = toVariantAttributes(item.variant.attributes);
            const label = attributesLabel(attrs);
            const imageUrl = item.product.images[0]?.url ?? null;

            return (
              <div key={item.id} className="flex gap-4 p-4">
                <Link
                  href={`/products/${item.product.slug}`}
                  className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted"
                >
                  {imageUrl && (
                    <Image
                      src={imageUrl}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  )}
                </Link>

                <div className="flex flex-1 flex-col gap-1">
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="font-medium hover:underline"
                  >
                    {item.product.name}
                  </Link>
                  {label && <p className="text-xs text-muted-foreground">{label}</p>}
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {formatCents(item.priceCents)} c/u × {item.quantity}
                  </p>
                </div>

                <div className="text-right font-medium tabular-nums">
                  {formatCents(item.priceCents * item.quantity)}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-8 rounded-lg border border-border p-4">
        <h2 className="mb-4 text-lg font-medium">Resumen</h2>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="tabular-nums">{formatCents(order.subtotalCents)}</dd>
          </div>
          {order.discountCents > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Descuento</dt>
              <dd className="tabular-nums">-{formatCents(order.discountCents)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Envío</dt>
            <dd className="tabular-nums">
              {order.shippingCents > 0 ? formatCents(order.shippingCents) : "Gratis"}
            </dd>
          </div>
          <div className="mt-2 flex justify-between border-t border-border pt-2 font-medium">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatCents(order.totalCents)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-border p-4">
        <h2 className="mb-4 text-lg font-medium">Dirección de envío</h2>
        <address className="text-sm not-italic text-muted-foreground">
          {order.addressLine1}
          {order.addressLine2 && <>, {order.addressLine2}</>}
          <br />
          {order.city}, {order.state} ({order.postalCode})
          <br />
          {order.country}
          {order.phone && (
            <>
              <br />
              Tel: {order.phone}
            </>
          )}
        </address>
      </section>
    </div>
  );
}
