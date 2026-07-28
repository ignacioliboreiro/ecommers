import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";

import { auth } from "@/auth";
import { getOrderForUser } from "@/src/modules/orders/actions/get-order";
import { OrderStatusPoller } from "@/src/modules/orders/components/order-status-poller";

export const metadata: Metadata = {
  title: "Order Confirmation",
};

interface OrderConfirmationPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderConfirmationPage({ params }: OrderConfirmationPageProps) {
  const { orderId } = await params;

  // Ruta pública (guests llegan acá recién pagado, sin sesión). Solo se
  // busca la orden si hay sesión y es del usuario; si no, se muestra el
  // mensaje genérico sin datos — no se rompe el flujo de guest.
  const session = await auth();
  const order = session?.user?.id ? await getOrderForUser(orderId, session.user.id) : null;
  const isPending = order?.status === "PENDING_PAYMENT" || order?.status === "PROCESSING";

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
      <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Check className="h-6 w-6" />
      </div>
      <h1 className="mb-4 text-3xl font-bold tracking-tight">
        ¡Gracias por tu compra!
      </h1>
      <p className="mb-6 text-lg text-muted-foreground">
        Tu pedido <span className="font-mono">{orderId}</span> ha sido
        confirmado y está siendo procesado.
      </p>

      {isPending && order && (
        <div className="mb-8 text-left">
          <OrderStatusPoller orderId={order.id} initialStatus={order.status} />
        </div>
      )}

      <div className="mb-8">
        <p className="mb-2 text-sm font-medium">
          Te enviaremos un email de confirmación próximamente.
        </p>
        <p className="text-sm text-muted-foreground">
          Puedes ver el estado de tu pedido en tu cuenta.
        </p>
      </div>
      <Link href="/" className="text-sm font-medium underline">
        Volver al inicio
      </Link>
    </div>
  );
}
