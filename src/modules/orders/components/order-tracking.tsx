import { Check, Package, Truck } from "lucide-react";

import { getShippingProviderById } from "@/lib/shipping";
import type { ShipmentTracking, TrackingStatus } from "@/lib/shipping/types";
import type { OrderWithItems } from "@/src/modules/orders/types/order";

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "medium",
  timeStyle: "short",
});

const dayFormatter = new Intl.DateTimeFormat("es-AR", { dateStyle: "long" });

/** Estados en los que tiene sentido hablar de un envío. */
const SHIPPABLE_STATUSES = ["PAID", "FULFILLED"] as const;

const STATUS_ICONS: Record<TrackingStatus, typeof Package> = {
  pending: Package,
  shipped: Truck,
  in_transit: Truck,
  delivered: Check,
  failed: Package,
};

/**
 * Estado del envío de un pedido. Server Component async: consulta al adapter que
 * generó el envío (`Order.shippingProvider`), no al configurado hoy — si la
 * instalación cambió de courier, los envíos viejos se siguen consultando donde
 * corresponde.
 *
 * No renderiza nada si el pedido no está en un estado despachable o si todavía
 * no tiene envío generado, salvo el aviso de "preparando" cuando está pagado.
 */
export async function OrderTracking({ order }: { order: OrderWithItems }) {
  if (!(SHIPPABLE_STATUSES as readonly string[]).includes(order.status)) return null;

  if (!order.trackingId || !order.shippingProvider) {
    return (
      <section className="mb-8 rounded-lg border border-border p-4">
        <h2 className="mb-2 text-lg font-medium">Envío</h2>
        <p className="text-sm text-muted-foreground">
          Estamos preparando tu pedido. En breve vas a ver acá el código de seguimiento.
        </p>
      </section>
    );
  }

  const provider = getShippingProviderById(order.shippingProvider);

  let tracking: ShipmentTracking | null = null;
  let error: string | null = null;

  if (!provider) {
    error = `El proveedor de envíos "${order.shippingProvider}" ya no está disponible en esta instalación.`;
  } else {
    try {
      tracking = await provider.trackShipment(order.trackingId);
    } catch (err) {
      // Un courier caído no debe tirar abajo la página del pedido.
      console.error(`[Shipping] No se pudo consultar el envío ${order.trackingId}:`, err);
      error = "No pudimos consultar el estado del envío en este momento.";
    }
  }

  return (
    <section className="mb-8 rounded-lg border border-border p-4">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-medium">Envío</h2>
        <p className="font-mono text-xs text-muted-foreground">{order.trackingId}</p>
      </div>

      {error && <p className="text-sm text-muted-foreground">{error}</p>}

      {tracking && (
        <>
          <ol className="flex flex-col gap-3">
            {tracking.history.map((event, index) => {
              const Icon = STATUS_ICONS[event.status];
              const isCurrent = index === tracking.history.length - 1;

              return (
                <li key={`${event.status}-${index}`} className="flex items-start gap-3">
                  <span
                    className={
                      isCurrent
                        ? "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                        : "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                    }
                  >
                    <Icon className="size-3.5" aria-hidden />
                  </span>
                  <div className="flex flex-col">
                    <span className={isCurrent ? "text-sm font-medium" : "text-sm"}>
                      {event.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {dateFormatter.format(event.at)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>

          {tracking.status !== "delivered" && tracking.estimatedDeliveryAt && (
            <p className="mt-4 border-t border-border pt-3 text-sm text-muted-foreground">
              Entrega estimada: {dayFormatter.format(tracking.estimatedDeliveryAt)}
            </p>
          )}

          {tracking.trackingUrl && (
            <a
              href={tracking.trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block text-sm font-medium underline"
            >
              Seguir en el sitio del correo
            </a>
          )}
        </>
      )}
    </section>
  );
}
