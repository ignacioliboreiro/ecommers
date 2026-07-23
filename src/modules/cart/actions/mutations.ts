"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import {
  AddItemSchema,
  RemoveItemSchema,
  UpdateQuantitySchema,
  type CartActionState,
} from "@/src/modules/cart/types/cart";

import { getOrCreateCart, resolveCartOwnerForWrite } from "./cart-owner";

function ok(message: string): CartActionState {
  return { status: "success", message };
}

function fail(message: string): CartActionState {
  return { status: "error", message };
}

function revalidateCart() {
  // El contador del carrito vive en el layout del storefront; refrescarlo
  // como 'layout' actualiza navbar + /cart + detalle de producto de una.
  revalidatePath("/", "layout");
}

export async function addItem(
  _prev: CartActionState,
  formData: FormData
): Promise<CartActionState> {
  const parsed = AddItemSchema.safeParse({
    variantId: formData.get("variantId"),
    quantity: formData.get("quantity"),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return fail(first);
  }

  const { variantId, quantity } = parsed.data;

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { id: true, stock: true, product: { select: { name: true } } },
  });
  if (!variant) return fail("El producto seleccionado no existe.");

  const owner = await resolveCartOwnerForWrite();
  const cart = await getOrCreateCart(owner);

  const existing = cart.items.find((item) => item.variantId === variantId);
  const currentQty = existing?.quantity ?? 0;
  const desiredQty = currentQty + quantity;

  if (desiredQty > variant.stock) {
    const remaining = Math.max(0, variant.stock - currentQty);
    if (remaining === 0) {
      return fail(
        currentQty > 0
          ? "Ya tenés en el carrito todo el stock disponible de este producto."
          : "No hay stock disponible de este producto."
      );
    }
    return fail(
      `Solo quedan ${variant.stock} unidades (ya tenés ${currentQty} en el carrito). Podés agregar ${remaining} más.`
    );
  }

  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    create: { cartId: cart.id, variantId, quantity },
    update: { quantity: desiredQty },
  });

  revalidateCart();
  return ok("Producto agregado al carrito.");
}

export async function updateQuantity(
  _prev: CartActionState,
  formData: FormData
): Promise<CartActionState> {
  const parsed = UpdateQuantitySchema.safeParse({
    itemId: formData.get("itemId"),
    quantity: formData.get("quantity"),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return fail(first);
  }

  const { itemId, quantity } = parsed.data;

  const owner = await resolveCartOwnerForWrite();
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: {
      cart: { select: { userId: true, guestId: true } },
      variant: { select: { stock: true } },
    },
  });
  if (!item) return fail("El producto ya no está en tu carrito.");

  // Autorización: el item tiene que pertenecer al carrito del owner actual.
  const belongsToOwner =
    "userId" in owner
      ? item.cart.userId === owner.userId
      : item.cart.guestId === owner.guestId;
  if (!belongsToOwner) return fail("No podés modificar este carrito.");

  if (quantity > item.variant.stock) {
    return fail(`Solo hay ${item.variant.stock} unidades disponibles.`);
  }

  await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
  });

  revalidateCart();
  return ok("Cantidad actualizada.");
}

export async function removeItem(
  _prev: CartActionState,
  formData: FormData
): Promise<CartActionState> {
  const parsed = RemoveItemSchema.safeParse({ itemId: formData.get("itemId") });
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Datos inválidos.");
  }

  const { itemId } = parsed.data;

  const owner = await resolveCartOwnerForWrite();
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: { select: { userId: true, guestId: true } } },
  });
  // Idempotente: si ya no existe, lo tratamos como éxito.
  if (!item) {
    revalidateCart();
    return ok("Producto eliminado del carrito.");
  }

  const belongsToOwner =
    "userId" in owner
      ? item.cart.userId === owner.userId
      : item.cart.guestId === owner.guestId;
  if (!belongsToOwner) return fail("No podés modificar este carrito.");

  await prisma.cartItem.delete({ where: { id: itemId } });

  revalidateCart();
  return ok("Producto eliminado del carrito.");
}
