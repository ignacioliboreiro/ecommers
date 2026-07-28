"use client";

import type { OrderStatus } from "@prisma/client";
import { Loader } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const PENDING_STATUSES: OrderStatus[] = ["PENDING_PAYMENT", "PROCESSING"];

interface OrderStatusPollerProps {
  orderId: string;
  initialStatus: OrderStatus;
  intervalMs?: number;
}

export function OrderStatusPoller({
  orderId,
  initialStatus,
  intervalMs = 3000,
}: OrderStatusPollerProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    if (!PENDING_STATUSES.includes(status)) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { status: OrderStatus };
        if (data.status !== status) {
          setStatus(data.status);
          if (!PENDING_STATUSES.includes(data.status)) {
            router.refresh();
          }
        }
      } catch {
        // Un fallo de red puntual no debe cortar el polling; se reintenta en el próximo ciclo.
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [orderId, status, intervalMs, router]);

  if (!PENDING_STATUSES.includes(status)) return null;

  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
      <Loader className="size-4 animate-spin" aria-hidden />
      Esperando confirmación de pago…
    </div>
  );
}
