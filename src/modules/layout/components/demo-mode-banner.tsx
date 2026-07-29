import { FlaskConical } from "lucide-react";

import { isDemoMode } from "@/lib/config/store-mode";

/**
 * Aviso de que la tienda está en modo demostración. Se renderiza al tope del
 * storefront y desaparece por completo con `STORE_MODE=production` (no queda ni
 * el nodo vacío).
 *
 * Es deliberadamente discreto — una barra fina, sin fondo saturado ni animación
 * ni botón de cerrar. Que no se pueda cerrar es a propósito: es la única señal
 * visible de que los pagos no son reales, y si el visitante la cierra por
 * costumbre deja de estar advertido.
 */
export function DemoModeBanner() {
  if (!isDemoMode()) return null;

  return (
    <div
      role="status"
      className="border-b border-border bg-muted/50 text-muted-foreground"
    >
      <p className="mx-auto flex w-full max-w-6xl items-center justify-center gap-2 px-4 py-2 text-center text-xs">
        <FlaskConical className="size-3.5 shrink-0" aria-hidden />
        <span>
          <span className="font-medium text-foreground">Tienda de demostración</span>
          {" — los pagos no son reales y ningún pedido se despacha."}
        </span>
      </p>
    </div>
  );
}
