import Image from "next/image";
import Link from "next/link";

import { formatCents } from "@/lib/money";
import { toVariantAttributes } from "@/src/modules/catalog/types/catalog";
import type { OrderWithItems } from "@/src/modules/orders/types/order";

function attributesLabel(attributes: Record<string, string>): string {
  return Object.entries(attributes)
    .map(([key, value]) => `${key}: ${value}`)
    .join(" · ");
}

/**
 * Items + resumen + dirección de un pedido. Compartido entre la vista del
 * comprador (app/(storefront)/orders/[id]) y la del admin
 * (app/admin/orders/[id]) — solo cambia lo que envuelve a este contenido
 * (header/badge/poller en el comprador; header/selector de estado/
 * auditoría en el admin).
 */
export function OrderDetailContent({ order }: { order: OrderWithItems }) {
  return (
    <>
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
    </>
  );
}
