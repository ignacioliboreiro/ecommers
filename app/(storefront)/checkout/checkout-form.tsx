"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { initiatePayment } from "@/src/modules/orders/actions/initiate-payment";
import { MercadoPagoCheckout } from "@/src/modules/orders/components/mercadopago-checkout";

const INITIAL_STATE = {
  orderId: "",
  paymentProvider: "STRIPE" as "STRIPE" | "MERCADO_PAGO",
  totalCents: 0,
  clientSecret: undefined as string | undefined,
  preferenceId: undefined as string | undefined,
  initPoint: undefined as string | undefined,
  providerRef: "",
  payerEmail: undefined as string | undefined,
  error: null as string | null,
};

export function CheckoutForm() {
  const [state, formAction, pending] = useActionState(initiatePayment, INITIAL_STATE);

  const orderCreated = !!state.orderId && !state.error;

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Dirección de envío</h2>
          <div className="p-4 bg-card border space-y-4">
            <div className="space-y-2">
              <label htmlFor="street" className="text-sm font-medium">
                Calle *
              </label>
              <input
                id="street"
                name="street"
                type="text"
                required
                className="input input-bordered w-full"
                placeholder="Calle y número"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="city" className="text-sm font-medium">
                  Ciudad *
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  required
                  className="input input-bordered w-full"
                  placeholder="Ciudad"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="state" className="text-sm font-medium">
                  Provincia/Estado *
                </label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  required
                  className="input input-bordered w-full"
                  placeholder="Provincia/Estado"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="postalCode" className="text-sm font-medium">
                  Código Postal *
                </label>
                <input
                  id="postalCode"
                  name="postalCode"
                  type="text"
                  required
                  className="input input-bordered w-full"
                  placeholder="Código Postal"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="country" className="text-sm font-medium">
                  País *
                </label>
                <input
                  id="country"
                  name="country"
                  type="text"
                  required
                  className="input input-bordered w-full"
                  placeholder="País"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Teléfono (opcional)
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="input input-bordered w-full"
                placeholder="Teléfono de contacto"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-medium">Método de pago</h2>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="paymentProviderType"
                value="STRIPE"
                defaultChecked
                className="radio"
              />
              Stripe (Tarjeta de crédito/débito)
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="paymentProviderType"
                value="MERCADO_PAGO"
                className="radio"
              />
              Mercado Pago
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-medium">Contacto</h2>
          <div className="space-y-2">
            <label htmlFor="payerEmail" className="text-sm font-medium">
              Email (opcional)
            </label>
            <input
              id="payerEmail"
              name="payerEmail"
              type="email"
              autoComplete="email"
              className="input input-bordered w-full max-w-xs"
              placeholder="tu@email.com"
            />
          </div>
        </div>

        {state.error && (
          <div className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-md">
            {state.error}
          </div>
        )}

        {!orderCreated && (
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Procesando pago..." : "Completar compra"}
          </Button>
        )}
      </form>

      {orderCreated && state.paymentProvider === "MERCADO_PAGO" && (
        <div className="p-4 bg-card border">
          <h2 className="text-lg font-medium mb-4">Pagá con tarjeta</h2>
          <MercadoPagoCheckout
            orderId={state.orderId}
            amountCents={state.totalCents}
            payerEmail={state.payerEmail}
          />
        </div>
      )}

      {orderCreated && state.paymentProvider === "STRIPE" && (
        <div className="p-4 bg-success/10 border border-success rounded-md">
          <p className="text-success">
            Orden creada exitosamente ({state.clientSecret ? "clientSecret listo" : "esperando pago"}).
          </p>
        </div>
      )}
    </div>
  );
}
