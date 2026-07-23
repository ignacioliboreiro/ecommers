import "server-only";

import { prisma } from "@/lib/prisma";

import { clearGuestCookie, readGuestId } from "./guest-cookie";

/**
 * Fusiona el carrito de invitado (si existe) en el carrito del usuario que
 * acaba de loguearse. Suma cantidades cuando la variante coincide, respeta el
 * stock disponible, agrega las variantes nuevas, y borra el carrito invitado
 * + su cookie. Idempotente: si no hay carrito invitado, no hace nada.
 */
export async function mergeGuestCartIntoUser(userId: string): Promise<void> {
  const guestId = await readGuestId();
  if (!guestId) return;

  const guestCart = await prisma.cart.findUnique({
    where: { guestId },
    include: { items: true },
  });

  // Sin carrito invitado o vacío: limpiamos la cookie y salimos.
  if (!guestCart || guestCart.items.length === 0) {
    if (guestCart) await prisma.cart.delete({ where: { id: guestCart.id } });
    await clearGuestCookie();
    return;
  }

  await prisma.$transaction(async (tx) => {
    const userCart = await tx.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: { items: true },
    });

    // Stock por variante para no exceder el disponible al sumar cantidades.
    const variantIds = guestCart.items.map((item) => item.variantId);
    const variants = await tx.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: { id: true, stock: true },
    });
    const stockByVariant = new Map(variants.map((v) => [v.id, v.stock]));
    const userQtyByVariant = new Map(
      userCart.items.map((item) => [item.variantId, item.quantity])
    );

    for (const guestItem of guestCart.items) {
      const stock = stockByVariant.get(guestItem.variantId);
      if (stock === undefined || stock <= 0) continue; // variante sin stock o inexistente

      const currentUserQty = userQtyByVariant.get(guestItem.variantId) ?? 0;
      const merged = Math.min(currentUserQty + guestItem.quantity, stock);
      if (merged <= 0 || merged === currentUserQty) continue;

      await tx.cartItem.upsert({
        where: {
          cartId_variantId: { cartId: userCart.id, variantId: guestItem.variantId },
        },
        create: {
          cartId: userCart.id,
          variantId: guestItem.variantId,
          quantity: merged,
        },
        update: { quantity: merged },
      });
    }

    await tx.cart.delete({ where: { id: guestCart.id } });
  });

  await clearGuestCookie();
}
