"use client";

import type { OrderStatus } from "@prisma/client";
import { useActionState, useRef, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateOrderStatus } from "@/src/modules/admin/actions/update-order-status";

const ALL_STATUSES: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PROCESSING",
  "PAID",
  "FULFILLED",
  "CANCELLED",
  "REFUNDED",
  "EXPIRED",
];

// CANCELLED dispara la restauración real de stock (ver
// restoreStockForOrder) — confirmar antes de aplicar, no es reversible
// con un solo click.
const DESTRUCTIVE_STATUSES: OrderStatus[] = ["CANCELLED", "REFUNDED"];

export function OrderStatusForm({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const [state, formAction, pending] = useActionState(updateOrderStatus, undefined);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(currentStatus);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (DESTRUCTIVE_STATUSES.includes(selectedStatus) && !confirmOpen) {
      e.preventDefault();
      setConfirmOpen(true);
    }
  }

  return (
    <>
      <form
        ref={formRef}
        action={formAction}
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-lg border border-border p-4"
      >
        <input type="hidden" name="orderId" value={orderId} />
        <h2 className="text-lg font-medium">Cambiar estado</h2>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className="text-sm font-medium">
            Nuevo estado
          </label>
          <select
            id="status"
            name="status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="note" className="text-sm font-medium">
            Nota (opcional)
          </label>
          <Textarea id="note" name="note" rows={2} placeholder="Motivo del cambio…" />
        </div>

        <div aria-live="polite">
          {state?.status === "error" && (
            <p className="text-sm text-destructive" role="alert">
              {state.message}
            </p>
          )}
          {state?.status === "success" && (
            <p className="text-sm text-primary" role="status">
              {state.message}
            </p>
          )}
        </div>

        <Button type="submit" disabled={pending} className="w-fit">
          {pending ? "Guardando…" : "Guardar cambio"}
        </Button>
      </form>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cambiar a {selectedStatus}?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedStatus === "CANCELLED"
                ? "Esto restaura el stock reservado de esta orden. Esta acción queda registrada en el historial pero no se puede deshacer automáticamente."
                : "Esta acción queda registrada en el historial. Confirmá que querés continuar."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                formRef.current?.requestSubmit();
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
