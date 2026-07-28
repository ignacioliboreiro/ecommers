"use client";

import { useEffect, useState } from "react";
import { CardPayment, initMercadoPago } from "@mercadopago/sdk-react";

interface MercadoPagoCheckoutProps {
  orderId: string;
  amountCents: number;
  payerEmail?: string;
}

export function MercadoPagoCheckout({ orderId, amountCents, payerEmail }: MercadoPagoCheckoutProps) {
  const [result, setResult] = useState<{ status: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
    if (publicKey) initMercadoPago(publicKey, { locale: "es-AR" });
  }, []);

  return (
    <div className="space-y-4">
      <CardPayment
        initialization={{ amount: amountCents / 100, payer: { email: payerEmail } }}
        onSubmit={async (formData) => {
          const response = await fetch("/api/payments/mercadopago/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId, ...formData }),
          });

          if (!response.ok) {
            setResult({ status: "error", message: "No se pudo procesar el pago. Intentá de nuevo." });
            return;
          }

          setResult({
            status: "success",
            message: "Pago enviado. Confirmando con Mercado Pago...",
          });
        }}
        onError={(error) => {
          console.error("Card Payment Brick error:", error);
          setResult({ status: "error", message: "Ocurrió un error con el formulario de pago." });
        }}
      />

      {result && (
        <p
          className={
            result.status === "error"
              ? "text-sm text-destructive"
              : "text-sm text-green-600"
          }
        >
          {result.message}
        </p>
      )}
    </div>
  );
}
