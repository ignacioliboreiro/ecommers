import "server-only";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CART_INCLUDE, type CartWithItems } from "@/src/modules/cart/types/cart";

import { ensureGuestId, readGuestId } from "./guest-cookie";

type OwnerWhere = { userId: string } | { guestId: string };

/**
 * Identifica al dueño del carrito para *lectura*: usuario logueado si hay
 * sesión, si no el guestId de la cookie (sin crearlo). Devuelve null si es un
 * invitado que todavía no tiene cookie (no hay carrito posible aún).
 */
export async function resolveCartOwnerReadonly(): Promise<OwnerWhere | null> {
  const session = await auth();
  if (session?.user?.id) return { userId: session.user.id };

  const guestId = await readGuestId();
  return guestId ? { guestId } : null;
}

/**
 * Identifica al dueño para *mutación*: usuario logueado, o crea/lee el guestId
 * (seteando la cookie firmada si hace falta). Siempre devuelve un owner.
 */
export async function resolveCartOwnerForWrite(): Promise<OwnerWhere> {
  const session = await auth();
  if (session?.user?.id) return { userId: session.user.id };

  const guestId = await ensureGuestId();
  return { guestId };
}

export async function findCart(where: OwnerWhere): Promise<CartWithItems | null> {
  return prisma.cart.findUnique({ where, include: CART_INCLUDE });
}

export async function getOrCreateCart(where: OwnerWhere): Promise<CartWithItems> {
  const existing = await prisma.cart.findUnique({ where, include: CART_INCLUDE });
  if (existing) return existing;

  return prisma.cart.create({ data: where, include: CART_INCLUDE });
}
