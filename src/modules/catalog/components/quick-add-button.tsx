"use client";

import { startTransition, useEffect, useMemo, useState, type MouseEvent } from "react";
import { useActionState } from "react";
import { Check, Loader2, ShoppingCart } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatCents } from "@/lib/money";
import { addItem } from "@/src/modules/cart/actions/mutations";
import {
  toVariantAttributes,
  type ProductVariantSummary,
} from "@/src/modules/catalog/types/catalog";

/**
 * Botón de "agregar rápido" en la card del catálogo — icono de carrito solo,
 * sin label, para no competir con la imagen ni el precio.
 *
 * El problema real que resuelve: muchos productos tienen variantes
 * (talle/color/capacidad) y no se puede agregar "el producto" sin saber cuál.
 * La decisión no se basa en cuántas variantes tiene el producto, sino en
 * cuántas están **comprables hoy** (`stock > 0`):
 *
 * - 0 comprables → deshabilitado. No hay nada entre qué elegir: mostrar un
 *   selector para elegir "ninguna" no tendría sentido, así que no es el mismo
 *   caso que "elegí una opción" — es simplemente "sin stock" (ya se ve en el
 *   precio de la card).
 * - 1 comprable → se agrega directo, sin ningún selector. Esto cubre tanto el
 *   producto sin variantes reales (una sola fila en la tabla) como el caso de
 *   un producto con 3 variantes donde 2 están agotadas: si solo queda una
 *   opción posible, pedirle al usuario que "elija" es fricción sin beneficio.
 * - 2+ comprables → el ícono abre un popover con las opciones comprables (sin
 *   navegar a la página de detalle). Se eligió esto por sobre deshabilitar +
 *   tooltip "elegí una opción" porque un catálogo variado (el pedido explícito
 *   de este seed) tiene MUCHOS productos con 2+ variantes — deshabilitar el
 *   quick-add para todos esos productos lo dejaría útil solo para una
 *   minoría del catálogo. El popover cubre el caso general sin duplicar el
 *   selector completo de atributos de la página de detalle (que agrupa por
 *   talle/color por separado): acá cada fila es directamente una variante
 *   comprable con su precio, lo cual funciona igual sin importar qué
 *   atributos tenga (talle+color, material, capacidad, ninguno).
 *
 * Reusa la Server Action `addItem` de `src/modules/cart/actions/mutations.ts`
 * (la misma que usa el selector de la página de detalle), así que la
 * invalidación del carrito — y el contador del navbar — funciona exactamente
 * igual sin código nuevo.
 */
export function QuickAddButton({
  variants,
  className,
}: {
  variants: ProductVariantSummary[];
  className?: string;
}) {
  const purchasable = useMemo(
    () => variants.filter((v) => v.stock > 0).sort((a, b) => a.priceCents - b.priceCents),
    [variants]
  );

  const [state, formAction, pending] = useActionState(addItem, undefined);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // Al agregar con éxito desde el popover, cerrarlo solo después de que se
  // alcance a ver el check — cerrarlo de inmediato no deja confirmar que
  // agregó la opción correcta.
  useEffect(() => {
    if (state?.status !== "success" || !open) return;
    const timeout = setTimeout(() => setOpen(false), 900);
    return () => clearTimeout(timeout);
  }, [state, open]);

  function addVariant(variantId: string) {
    setAddingId(variantId);
    const formData = new FormData();
    formData.set("variantId", variantId);
    formData.set("quantity", "1");
    // `formAction` viene de useActionState: llamarlo directo en un onClick (sin
    // pasar por un <form action={...}>) requiere envolverlo en startTransition
    // a mano — si no, React 19 lo marca en consola y `pending` deja de ser
    // confiable (por eso el popover necesita esto: cada fila dispara la acción
    // de forma imperativa, no vía submit de un form).
    startTransition(() => {
      formAction(formData);
    });
  }

  // El botón está fuera del <Link> que cubre toda la card (ver product-card),
  // pero por las dudas cualquier click acá no debe burbujear hacia otros
  // manejadores.
  function stopPropagation(event: MouseEvent) {
    event.stopPropagation();
  }

  // Sin `backdrop-blur`: reportado por el usuario como invisible en un
  // celular real (aunque presente y clickeable en el DOM — confirmado con
  // Playwright en Chromium y WebKit móvil, que tampoco lo reprodujeron).
  // `backdrop-filter` anidado dentro de dos ancestros `overflow-hidden` +
  // `rounded-2xl` (el wrapper de la imagen y la card entera) es una
  // combinación con bugs de renderizado documentados en motores móviles
  // reales — a diferencia del grain de fondo, este botón es la ÚNICA forma
  // de agregar sin entrar al detalle, así que no puede depender de un efecto
  // que puede fallar en hardware real. Un fondo sólido semi-opaco (sin
  // blur) logra el mismo look sin esa dependencia.
  const baseButtonClass =
    "flex size-8 shrink-0 items-center justify-center rounded-full bg-background/90 text-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60";

  if (purchasable.length === 0) {
    return (
      <button
        type="button"
        disabled
        title="Sin stock disponible"
        aria-label="Sin stock disponible"
        onClick={stopPropagation}
        className={cn(baseButtonClass, "text-muted-foreground/60", className)}
      >
        <ShoppingCart className="size-4" aria-hidden />
      </button>
    );
  }

  if (purchasable.length === 1) {
    const only = purchasable[0];
    const isPending = pending && addingId === only.id;
    const justAdded = state?.status === "success" && addingId === only.id;

    return (
      <button
        type="button"
        disabled={isPending}
        aria-label="Agregar al carrito"
        onClick={(event) => {
          stopPropagation(event);
          addVariant(only.id);
        }}
        className={cn(baseButtonClass, className)}
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : justAdded ? (
          <Check className="size-4 text-green-500" aria-hidden />
        ) : (
          <ShoppingCart className="size-4" aria-hidden />
        )}
      </button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        onClick={stopPropagation}
        aria-label="Elegí una opción para agregar al carrito"
        className={cn(baseButtonClass, className)}
      >
        <ShoppingCart className="size-4" aria-hidden />
      </PopoverTrigger>
      <PopoverContent onClick={stopPropagation} className="w-56 p-1.5">
        <p className="px-1.5 pb-1 pt-0.5 text-xs font-medium text-muted-foreground">
          Elegí una opción
        </p>
        <div className="flex flex-col gap-0.5">
          {purchasable.map((variant) => {
            const attrs = toVariantAttributes(variant.attributes);
            const label = Object.values(attrs).filter(Boolean).join(" · ") || "Opción única";
            const isPending = pending && addingId === variant.id;
            const justAdded = state?.status === "success" && addingId === variant.id;

            return (
              <button
                key={variant.id}
                type="button"
                disabled={isPending}
                onClick={() => addVariant(variant.id)}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="truncate">{label}</span>
                <span className="flex shrink-0 items-center gap-1.5 tabular-nums text-muted-foreground">
                  {isPending ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  ) : justAdded ? (
                    <Check className="size-3.5 text-green-500" aria-hidden />
                  ) : (
                    formatCents(variant.priceCents)
                  )}
                </span>
              </button>
            );
          })}
        </div>
        <AnimatePresence>
          {state?.status === "error" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              role="alert"
              className="px-1.5 pt-1.5 text-xs text-destructive"
            >
              {state.message}
            </motion.p>
          )}
        </AnimatePresence>
      </PopoverContent>
    </Popover>
  );
}
