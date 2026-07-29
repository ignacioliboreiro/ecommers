import "server-only";

import { auth } from "@/auth";
import { getInvoiceProvider } from "@/lib/invoicing";
import { prisma } from "@/lib/prisma";
import { readGuestId } from "@/src/modules/cart/actions/guest-cookie";
import { toVariantAttributes } from "@/src/modules/catalog/types/catalog";

/** Estados en los que existe un comprobante: la plata efectivamente entró. */
const INVOICEABLE_STATUSES = ["PAID", "FULFILLED", "REFUNDED"];

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  STRIPE: "Tarjeta (Stripe)",
  MERCADO_PAGO: "Mercado Pago",
  MOCK: "Pago simulado (demostración)",
};

/**
 * Descarga el comprobante de un pedido en PDF.
 *
 * El PDF se genera al vuelo en cada request y no se guarda en ningún lado. Es a
 * propósito: no hay estado que sincronizar, y como el contenido se deriva de la
 * orden, un comprobante nunca puede quedar desactualizado respecto de ella.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      items: {
        include: {
          product: { select: { name: true } },
          variant: { select: { attributes: true } },
        },
      },
    },
  });

  if (!order) {
    return new Response("Not found", { status: 404 });
  }

  // Autorización: dueño de la orden (usuario logueado o invitado con su cookie
  // firmada) o un admin. Se responde 404 y no 403 para no revelar la existencia
  // de órdenes ajenas — mismo criterio que `getOrderForUser`.
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";
  const guestId = await readGuestId();

  const isOwner = order.userId
    ? order.userId === session?.user?.id
    : order.guestId
      ? order.guestId === guestId
      : false;

  if (!isOwner && !isAdmin) {
    return new Response("Not found", { status: 404 });
  }

  if (!INVOICEABLE_STATUSES.includes(order.status)) {
    return new Response("El pedido todavía no tiene comprobante.", { status: 409 });
  }

  const invoice = await getInvoiceProvider().generateInvoice({
    orderId: order.id,
    createdAt: order.createdAt,
    customerName: order.user?.name ?? null,
    customerEmail: order.contactEmail ?? order.user?.email ?? null,
    address: {
      line1: order.addressLine1,
      line2: order.addressLine2,
      city: order.city,
      state: order.state,
      postalCode: order.postalCode,
      country: order.country,
    },
    items: order.items.map((item) => {
      const attrs = toVariantAttributes(item.variant.attributes);
      const variantLabel = Object.entries(attrs)
        .map(([key, value]) => `${key}: ${value}`)
        .join(" · ");

      return {
        description: item.product.name,
        variantLabel: variantLabel || null,
        quantity: item.quantity,
        unitPriceCents: item.priceCents,
      };
    }),
    subtotalCents: order.subtotalCents,
    discountCents: order.discountCents,
    shippingCents: order.shippingCents,
    taxCents: order.taxCents,
    totalCents: order.totalCents,
    currency: order.currency,
    paymentMethodLabel:
      PAYMENT_METHOD_LABELS[order.paymentProvider] ?? order.paymentProvider,
  });

  // Uint8Array → BodyInit: se copia a un ArrayBuffer propio porque el buffer de
  // pdf-lib puede ser una vista sobre un buffer más grande.
  const body = invoice.bytes.slice().buffer as ArrayBuffer;

  return new Response(body, {
    status: 200,
    headers: {
      "content-type": invoice.mimeType,
      "content-disposition": `attachment; filename="${invoice.fileName}"`,
      // Sin caché: el comprobante se deriva de la orden, que puede cambiar.
      "cache-control": "no-store",
    },
  });
}
