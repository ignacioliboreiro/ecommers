"use client";

import { AnimatePresence, motion } from "motion/react";

import { CartItemRow } from "@/src/modules/cart/components/cart-item-row";
import type { CartLineItem } from "@/src/modules/cart/types/cart";

export function CartList({ items }: { items: CartLineItem[] }) {
  return (
    <ul className="divide-y divide-border">
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.li
            key={item.id}
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="list-none overflow-hidden"
          >
            <CartItemRow item={item} />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
