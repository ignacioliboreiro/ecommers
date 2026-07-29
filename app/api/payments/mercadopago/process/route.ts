import "server-only";

import { MercadoPagoConfig, Payment } from "mercadopago";

import { isDemoMode } from "@/lib/config/store-mode";
import { prisma } from "@/lib/prisma";

/**
 * Recibe el `formData` que el Card Payment Brick tokeniza client-side y
 * cobra server-side con el token. La Order sigue sin actualizarse acá: el
 * webhook (fuente de verdad) es quien mueve status/stock/carrito cuando MP
 * confirma — este endpoint solo dispara el cobro.
 */
export async function POST(request: Request) {
  // Defensa en profundidad: en modo demo el checkout no monta el Brick de MP,
  // pero esta ruta es pública. Sin este chequeo, un POST directo podría iniciar
  // un cobro real desde una instalación de demostración.
  if (isDemoMode()) {
    return Response.json(
      { error: "La tienda está en modo demostración: no se procesan pagos reales." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { orderId, ...brickData } = body as { orderId?: string; [key: string]: unknown };

  if (!orderId) {
    return Response.json({ error: "Falta orderId" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return Response.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return Response.json({ error: "MERCADOPAGO_ACCESS_TOKEN no configurado" }, { status: 500 });
  }

  const payment = new Payment(new MercadoPagoConfig({ accessToken }));

  try {
    const result = await payment.create({
      body: {
        transaction_amount: order.totalCents / 100,
        token: brickData.token as string | undefined,
        description: `Pedido #${order.id}`,
        installments: Number(brickData.installments) || 1,
        payment_method_id: brickData.payment_method_id as string | undefined,
        issuer_id: brickData.issuer_id ? Number(brickData.issuer_id) : undefined,
        external_reference: order.id,
        payer: {
          email: (brickData.payer as { email?: string } | undefined)?.email ?? order.contactEmail ?? undefined,
          identification: (brickData.payer as { identification?: { type: string; number: string } } | undefined)
            ?.identification,
        },
      },
    });

    return Response.json({ status: result.status, id: result.id });
  } catch (err) {
    console.error("Error creando pago de Mercado Pago:", err);
    return Response.json({ error: "No se pudo procesar el pago" }, { status: 502 });
  }
}
