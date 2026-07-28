import { expireOldOrders } from "@/src/modules/orders/actions/expire-orders";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const expired = await expireOldOrders();
  return Response.json({ expired });
}
