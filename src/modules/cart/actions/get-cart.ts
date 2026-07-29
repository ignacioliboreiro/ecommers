import "server-only";

import {
  EMPTY_CART_SUMMARY,
  toCartSummary,
  type CartSummary,
  type CartWithItems,
} from "@/src/modules/cart/types/cart";

import { findCart, resolveCartOwnerReadonly } from "./cart-owner";

export async function getCart(): Promise<CartSummary> {
  const owner = await resolveCartOwnerReadonly();
  if (!owner) return EMPTY_CART_SUMMARY;

  const cart = await findCart(owner);
  return toCartSummary(cart);
}

/**
 * Get the full cart with product/variant relations included.
 * Used for operations that need detailed product information (like checkout).
 */
export async function getCartWithItems(): Promise<CartWithItems | null> {
  const owner = await resolveCartOwnerReadonly();
  if (!owner) return null;

  return await findCart(owner);
}
