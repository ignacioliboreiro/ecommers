import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CircleX, FlaskConical, Lock } from "lucide-react";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { isDemoMode } from "@/lib/config/store-mode";
import { formatCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { readGuestId } from "@/src/modules/cart/actions/guest-cookie";
import { simulatePaymentResult } from "@/src/modules/payments/actions/simulate-payment";

export const metadata: Metadata = {
  title: "Pago de demostración",
};

interface DemoPaymentPageProps {
  params: Promise<{ orderId: string }>;
}

/**
 * Sustituto del checkout del proveedor cuando `STORE_MODE=demo`.
 *
 * Cumple el rol que en producción cumple el Brick de Mercado Pago o el Payment
 * Element de Stripe: una pantalla donde el pago se resuelve. La diferencia es
 * que el resultado lo elige el visitante con un botón en vez de una tarjeta.
 */
export default async function DemoPaymentPage({ params }: DemoPaymentPageProps) {
  // Si la instalación pasó a producción, esta ruta no existe. `notFound` y no
  // un error: es una página que simplemente no aplica a esa instalación.
  if (!isDemoMode()) notFound();

  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      guestId: true,
      status: true,
      paymentProvider: true,
      subtotalCents: true,
      shippingCents: true,
      totalCents: true,
      items: {
        select: {
          id: true,
          quantity: true,
          priceCents: true,
          product: { select: { name: true } },
        },
      },
    },
  });

  if (!order) notFound();

  // Autorización con el mismo criterio que el resto del proyecto: si la orden no
  // es del visitante, se responde 404 en vez de 403 para no revelar que existe.
  const session = await auth();
  const guestId = await readGuestId();
  const isOwner = order.userId
    ? order.userId === session?.user?.id
    : order.guestId
      ? order.guestId === guestId
      : false;

  if (!isOwner) notFound();
  if (order.paymentProvider !== "MOCK") notFound();

  // Ya resuelta y aprobada: no tiene sentido volver a "pagarla".
  if (order.status === "PAID" || order.status === "FULFILLED") {
    redirect(`/order/${order.id}`);
  }

  const isRejected =
    order.status === "CANCELLED" || order.status === "EXPIRED" || order.status === "REFUNDED";

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10">
      <div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
        <FlaskConical className="size-3.5 shrink-0" aria-hidden />
        Pasarela de pago simulada
      </div>

      <h1 className="mb-2 text-2xl font-semibold tracking-tight">
        {isRejected ? "El pago fue rechazado" : "Confirmar el pago"}
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        {isRejected
          ? "Así se ve un pago rechazado: el pedido quedó cancelado y el stock volvió al catálogo. Tus productos siguen en el carrito."
          : "Esta pantalla reemplaza al checkout del proveedor. Elegí el resultado que querés simular."}
      </p>

      <section className="mb-8 rounded-lg border border-border p-4">
        <h2 className="mb-3 text-sm font-medium">
          Pedido #{order.id.slice(-8).toUpperCase()}
        </h2>
        <ul className="mb-4 flex flex-col gap-2 border-b border-border pb-4">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 text-sm">
              <span className="text-muted-foreground">
                {item.product.name} × {item.quantity}
              </span>
              <span className="tabular-nums">
                {formatCents(item.priceCents * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="tabular-nums">{formatCents(order.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Envío</dt>
            <dd className="tabular-nums">
              {order.shippingCents > 0 ? formatCents(order.shippingCents) : "Gratis"}
            </dd>
          </div>
          <div className="mt-1 flex justify-between border-t border-border pt-2 font-medium">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatCents(order.totalCents)}</dd>
          </div>
        </dl>
      </section>

      {isRejected ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            <CircleX className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>Pedido cancelado por pago rechazado.</span>
          </div>
          <Button
            render={<Link href="/cart">Volver al carrito</Link>}
            nativeButton={false}
            variant="outline"
            className="w-full"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/*
            Dos forms separados en vez de uno con dos submits: así cada botón
            manda su propio `outcome` sin depender de qué botón disparó el submit.
          */}
          <form action={simulatePaymentResult}>
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="outcome" value="approved" />
            <Button type="submit" size="lg" className="w-full">
              Simular pago aprobado
            </Button>
          </form>

          <form action={simulatePaymentResult}>
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="outcome" value="rejected" />
            <Button type="submit" size="lg" variant="outline" className="w-full">
              Simular pago rechazado
            </Button>
          </form>

          <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
            <Lock className="mt-0.5 size-3 shrink-0" aria-hidden />
            <span>
              No se pide ni se procesa ningún dato de tarjeta. Ambos resultados
              recorren el mismo código que un pago real: actualizan el pedido, el
              stock y el carrito.
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
