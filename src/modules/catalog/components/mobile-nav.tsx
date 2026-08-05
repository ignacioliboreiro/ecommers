"use client";

import Link from "next/link";
import { Menu, X, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { logout } from "@/app/actions/auth";
import type { CategoryNavItem } from "@/src/modules/catalog/types/catalog";

export function MobileNav({
  categories,
  isLoggedIn = false,
}: {
  categories: CategoryNavItem[];
  isLoggedIn?: boolean;
}) {
  const [open, setOpen] = useState(false);
  // `typeof window !== "undefined"` (lo que había antes acá) es SIEMPRE
  // `true` en un browser, incluido el primer render de hidratación de React
  // — no es un check "recién disponible después del mount". El servidor
  // renderiza `null` en esta rama (no hay `window` ahí), pero el cliente,
  // ya en su primer render, evaluaba la condición como verdadera e intentaba
  // montar el portal de inmediato: un mismatch de hidratación garantizado en
  // cada carga, no algo intermitente. `mounted` en cambio arranca en `false`
  // tanto en servidor como en el primer render del cliente (matchean), y
  // recién pasa a `true` en un efecto — que por definición corre después de
  // que la hidratación ya terminó.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    // `overflow: hidden` en <body> es la técnica "obvia" para bloquear el
    // scroll de fondo, pero es conocida por no ser confiable en iOS Safari
    // (no evita de forma consistente el scroll/rubber-band del contenido
    // detrás del menú, incluso con el overlay encima). La técnica robusta en
    // iOS es fijar el <body> en su posición actual (`position: fixed` +
    // `top` negativo con el scroll guardado) y recién ahí destrabarlo y
    // restaurar la posición al cerrar.
    const scrollY = window.scrollY;
    const { style } = document.body;
    style.position = "fixed";
    style.top = `-${scrollY}px`;
    style.left = "0";
    style.right = "0";

    return () => {
      style.position = "";
      style.top = "";
      style.left = "";
      style.right = "";
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        aria-expanded={open}
        className="inline-flex size-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-accent md:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      {mounted ? (
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                <motion.div
                  key="overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-50 bg-black/60 md:hidden"
                  onClick={() => setOpen(false)}
                />
                <motion.div
                  key="panel"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", stiffness: 320, damping: 32 }}
                  className="fixed inset-y-0 right-0 z-50 flex w-[82%] max-w-sm flex-col gap-1 bg-card p-5 shadow-2xl md:hidden"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <Link
                      href="/"
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center gap-1.5 text-lg font-semibold tracking-tight"
                    >
                      <Zap className="size-5 fill-primary text-primary" aria-hidden />
                      Voltio
                    </Link>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label="Cerrar menú"
                      className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <X className="size-5" aria-hidden />
                    </button>
                  </div>

                  <Link
                    href="/products"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                  >
                    Todos los productos
                  </Link>
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/products?category=${category.slug}`}
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      {category.name}
                    </Link>
                  ))}

                  <div className="mt-4 flex flex-col gap-1 border-t border-border pt-4">
                    {isLoggedIn ? (
                      <>
                        <Link
                          href="/orders"
                          onClick={() => setOpen(false)}
                          className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          Mis pedidos
                        </Link>
                        <form action={logout}>
                          <button
                            type="submit"
                            onClick={() => setOpen(false)}
                            className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                          >
                            Salir
                          </button>
                        </form>
                      </>
                    ) : (
                      <Link
                        href="/login"
                        onClick={() => setOpen(false)}
                        className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                      >
                        Ingresar
                      </Link>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )
      ) : null}
    </>
  );
}
