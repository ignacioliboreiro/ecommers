import type { OrderStatus } from "@prisma/client";
import { Clock, CircleCheck, CircleX, Loader, PackageCheck, RotateCcw } from "lucide-react";

import { Badge, badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; variant: BadgeVariant; Icon: typeof Clock }
> = {
  PENDING_PAYMENT: { label: "Esperando pago", variant: "outline", Icon: Clock },
  PROCESSING: { label: "Procesando", variant: "secondary", Icon: Loader },
  PAID: { label: "Pagado", variant: "default", Icon: CircleCheck },
  FULFILLED: { label: "Enviado", variant: "default", Icon: PackageCheck },
  CANCELLED: { label: "Cancelado", variant: "destructive", Icon: CircleX },
  EXPIRED: { label: "Expirado", variant: "destructive", Icon: Clock },
  REFUNDED: { label: "Reembolsado", variant: "secondary", Icon: RotateCcw },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, variant, Icon } = STATUS_CONFIG[status];
  return (
    <Badge variant={variant}>
      <Icon data-icon="inline-start" aria-hidden />
      {label}
    </Badge>
  );
}
