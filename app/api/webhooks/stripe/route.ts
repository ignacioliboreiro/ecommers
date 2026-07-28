import { stripeAdapter } from "@/lib/payments";
import { processPaymentEvent } from "@/src/modules/payments/actions/process-payment-event";

export async function POST(request: Request) {
  try {
    const buf = await request.text();
    const signature = request.headers.get("stripe-signature") || "";

    if (!stripeAdapter.verifyWebhookSignature(buf, signature)) {
      return new Response("Invalid signature", { status: 400 });
    }

    const event = await stripeAdapter.parseWebhookEvent(buf);
    if (!event) {
      return new Response("Unsupported event type", { status: 200 });
    }

    return await processPaymentEvent(event);
  } catch (err) {
    console.error("Stripe webhook error:", err);
    return new Response("Webhook error", { status: 500 });
  }
}
