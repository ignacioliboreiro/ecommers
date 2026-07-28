import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(null, { status: 401 });
  }

  const { id } = await params;

  // Mismo principio que getOrderForUser: filtrar por dueño en el where,
  // no chequear después — así no se puede distinguir "no existe" de "no es tuya".
  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id },
    select: { status: true },
  });

  if (!order) {
    return new Response(null, { status: 404 });
  }

  return Response.json({ status: order.status });
}
