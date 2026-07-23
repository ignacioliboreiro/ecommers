import "server-only";

import {
  EMPTY_CART_SUMMARY,
  toCartSummary,
  type CartSummary,
} from "@/src/modules/cart/types/cart";

import { findCart, resolveCartOwnerReadonly } from "./cart-owner";

export async function getCart(): Promise<CartSummary> {
  const owner = await resolveCartOwnerReadonly();
  if (!owner) return EMPTY_CART_SUMMARY;

  const cart = await findCart(owner);
  return toCartSummary(cart);
}
