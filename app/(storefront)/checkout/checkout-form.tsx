"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { FlaskConical, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCents } from "@/lib/money";
import { initiatePayment } from "@/src/modules/orders/actions/initiate-payment";
import {
  quoteShipping,
  type ShippingEstimate,
} from "@/src/modules/orders/actions/quote-shipping";
import { INITIATE_PAYMENT_INITIAL_STATE } from "@/src/modules/orders/types/payment-state";
import { MercadoPagoCheckout } from "@/src/modules/orders/components/mercadopago-checkout";

/**
 * `demoMode` llega por props desde el Server Component: `STORE_MODE` no existe
 * en el bundle del navegador (no es NEXT_PUBLIC_), y de todas formas el modo lo
 * decide el servidor — acá solo cambia lo que se muestra.
 */
export function CheckoutForm({ demoMode }: { demoMode: boolean }) {
  const [state, formAction, pending] = useActionState(
    initiatePayment,
    INITIATE_PAYMENT_INITIAL_STATE
  );

  const orderCreated = !!state.orderId && !state.error;

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-6">
        <fieldset className="space-y-4">
          <legend className="text-lg font-medium">Dirección de envío</legend>
          <div className="space-y-4 rounded-lg border border-border p-4">
            <div className="space-y-2">
              <Label htmlFor="street">Calle *</Label>
              <Input
                id="street"
                name="street"
                required
                autoComplete="street-address"
                placeholder="Calle y número"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad *</Label>
                <Input
                  id="city"
                  name="city"
                  required
                  autoComplete="address-level2"
                  placeholder="Ciudad"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Provincia *</Label>
                <Input
                  id="state"
                  name="state"
                  required
                  autoComplete="address-level1"
                  placeholder="Provincia"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="postalCode">Código postal *</Label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  required
                  autoComplete="postal-code"
                  placeholder="1425"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">País *</Label>
                <Input id="country" name="country" required autoComplete="country" defaultValue="AR" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono (opcional)</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="Teléfono de contacto"
              />
            </div>
          </div>

          <ShippingEstimateBox />
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-lg font-medium">Método de pago</legend>
          {demoMode ? (
            <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-4 text-sm">
              <FlaskConical className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <div>
                <p className="font-medium">Pago simulado</p>
                <p className="text-muted-foreground">
                  La tienda está en modo demostración. Al continuar vas a poder
                  elegir si el pago se aprueba o se rechaza, sin ingresar ninguna
                  tarjeta.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="paymentProviderType"
                  value="MERCADO_PAGO"
                  defaultChecked
                  className="size-4 accent-primary"
                />
                Mercado Pago (tarjeta de crédito o débito)
              </label>
            </div>
          )}
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-lg font-medium">Contacto</legend>
          <div className="space-y-2">
            <Label htmlFor="payerEmail">Email</Label>
            <Input
              id="payerEmail"
              name="payerEmail"
              type="email"
              autoComplete="email"
              placeholder="tu@email.com"
              className="max-w-sm"
            />
            <p className="text-xs text-muted-foreground">
              Ahí te enviamos la confirmación del pedido.
            </p>
          </div>
        </fieldset>

        {state.error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive"
          >
            {state.error}
          </div>
        )}

        {!orderCreated && (
          <Button type="submit" disabled={pending} size="lg" className="w-full">
            {pending
              ? "Procesando…"
              : demoMode
                ? "Continuar al pago simulado"
                : "Completar compra"}
          </Button>
        )}
      </form>

      {orderCreated && state.paymentProvider === "MERCADO_PAGO" && (
        <div className="rounded-lg border border-border p-4">
          <h2 className="mb-4 text-lg font-medium">Pagá con tarjeta</h2>
          <MercadoPagoCheckout
            orderId={state.orderId}
            amountCents={state.totalCents}
            payerEmail={state.payerEmail}
          />
        </div>
      )}

      {orderCreated && state.paymentProvider === "STRIPE" && (
        <div className="rounded-lg border border-border p-4 text-sm">
          Orden creada ({state.clientSecret ? "clientSecret listo" : "esperando pago"}).
          El Payment Element de Stripe todavía no está montado.
        </div>
      )}
    </div>
  );
}

/**
 * Cotización de envío en vivo. Escucha provincia y código postal del mismo
 * formulario y consulta al adapter cuando ambos están completos.
 *
 * Lee los valores del DOM en vez de manejar estado controlado para no convertir
 * todo el formulario en componente controlado por una sola feature accesoria.
 */
function ShippingEstimateBox() {
  const [estimate, setEstimate] = useState<ShippingEstimate | null>(null);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const form = containerRef.current?.closest("form");
    if (!form) return;

    let timeout: ReturnType<typeof setTimeout>;

    const recalculate = () => {
      clearTimeout(timeout);
      // Debounce: se dispara al tipear el CP, no queremos una llamada por tecla.
      timeout = setTimeout(() => {
        const data = new FormData(form);
        const state = String(data.get("state") ?? "");
        const postalCode = String(data.get("postalCode") ?? "");
        const city = String(data.get("city") ?? "");

        if (!state.trim() || !postalCode.trim()) {
          setEstimate(null);
          return;
        }

        startTransition(async () => {
          setEstimate(await quoteShipping(state, postalCode, city));
        });
      }, 400);
    };

    form.addEventListener("input", recalculate);
    return () => {
      clearTimeout(timeout);
      form.removeEventListener("input", recalculate);
    };
  }, []);

  return (
    <div ref={containerRef} aria-live="polite" className="min-h-5">
      {estimate && (
        <div className="flex items-start gap-2 text-sm">
          <Truck className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <p className={isPending ? "text-muted-foreground" : undefined}>
            <span className="font-medium">
              {estimate.freeShippingApplied
                ? "Envío gratis"
                : formatCents(estimate.costCents)}
            </span>
            {" — "}
            {estimate.serviceName}, llega en {estimate.estimatedDaysMin}-
            {estimate.estimatedDaysMax} días hábiles.
          </p>
        </div>
      )}
    </div>
  );
}
