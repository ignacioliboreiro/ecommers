import { mercadoPagoAdapter } from "@/lib/payments";
import { processPaymentEvent } from "@/src/modules/payments/actions/process-payment-event";

export async function POST(request: Request) {
  try {
    const buf = await request.text();
    const signature = request.headers.get("x-signature") || "";

    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const url = new URL(request.url);
    const query: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      query[key] = value;
    });

    if (!mercadoPagoAdapter.verifyWebhookSignature(buf, signature, { headers, query })) {
      return new Response("Invalid signature", { status: 400 });
    }

    const event = await mercadoPagoAdapter.parseWebhookEvent(buf);
    if (!event) {
      return new Response("Unsupported event type", { status: 200 });
    }

    return await processPaymentEvent(event);
  } catch (err) {
    console.error("Mercado Pago webhook error:", err);
    return new Response("Webhook error", { status: 500 });
  }
}
