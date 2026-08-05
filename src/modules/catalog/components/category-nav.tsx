import Link from "next/link";
import { Zap } from "lucide-react";

import { auth } from "@/auth";
import { getCategories } from "@/src/modules/catalog/actions/get-categories";
import { CartIcon } from "@/src/modules/cart/components/cart-icon";

import { MobileNav } from "./mobile-nav";
import { NavAccount } from "./nav-account";
import { NavLinks } from "./nav-links";

export async function CategoryNav() {
  const [categories, session] = await Promise.all([getCategories(), auth()]);

  return (
    <>
      {/*
        Sin esto, un usuario de teclado o lector de pantalla no tiene forma
        de saltear la nav y las categorías para llegar directo al contenido
        — tendría que tabular por todos los links del header en cada página.
        `sr-only` lo esconde visualmente hasta que recibe foco (con Tab).
      */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-lg font-semibold tracking-tight"
          >
            <Zap className="size-5 fill-primary text-primary" aria-hidden />
            Voltio
          </Link>

          <div className="hidden md:block">
            <NavLinks categories={categories} />
          </div>

          <div className="ml-auto flex items-center gap-1">
            <NavAccount />
            <div className="px-1">
              <CartIcon />
            </div>
            <MobileNav categories={categories} isLoggedIn={!!session?.user} />
          </div>
        </nav>
      </header>
    </>
  );
}
