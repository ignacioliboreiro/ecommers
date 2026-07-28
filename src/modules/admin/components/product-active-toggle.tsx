"use client";

import { useTransition } from "react";

import { Switch } from "@/components/ui/switch";
import { toggleProductActive } from "@/src/modules/admin/actions/products";

export function ProductActiveToggle({
  productId,
  isActive,
}: {
  productId: string;
  isActive: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Switch
      checked={isActive}
      disabled={pending}
      onCheckedChange={(next) => {
        startTransition(async () => {
          await toggleProductActive(productId, next);
        });
      }}
      aria-label={isActive ? "Desactivar producto" : "Activar producto"}
    />
  );
}
