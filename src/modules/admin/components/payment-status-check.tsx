"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  checkPaymentStatus,
  type PaymentStatusCheck,
} from "@/src/modules/admin/actions/check-payment-status";

/**
 * Botón de reconciliación: pregunta al proveedor el estado real del pago y lo
 * compara con el del pedido. Solo lee — no corrige nada (ver el comentario en
 * `check-payment-status.ts`).
 */
export function PaymentStatusCheckButton({ orderId }: { orderId: string }) {
  const [result, setResult] = useState<PaymentStatusCheck | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <section className="rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium">Estado del pago</h2>
          <p className="text-sm text-muted-foreground">
            Consulta al proveedor por si se perdió un webhook.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              setResult(await checkPaymentStatus(orderId));
            })
          }
        >
          <RefreshCw className={isPending ? "animate-spin" : undefined} aria-hidden />
          {isPending ? "Consultando…" : "Consultar al proveedor"}
        </Button>
      </div>

      {result && (
        <p
          role="status"
          className={
            result.mismatch || !result.ok
              ? "mt-3 border-t border-border pt-3 text-sm text-destructive"
              : "mt-3 border-t border-border pt-3 text-sm text-muted-foreground"
          }
        >
          {result.message}
        </p>
      )}
    </section>
  );
}
