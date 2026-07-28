import Link from "next/link";
import { Zap } from "lucide-react";

import { getCategories } from "@/src/modules/catalog/actions/get-categories";

export async function Footer() {
  const categories = await getCategories();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3 sm:col-span-2 lg:col-span-1">
          <Link href="/" className="inline-flex items-center gap-1.5 text-lg font-semibold tracking-tight">
            <Zap className="size-5 fill-primary text-primary" aria-hidden />
            Voltio
          </Link>
          <p className="max-w-xs text-sm text-muted-foreground">
            Electrónica elegida con criterio: probamos cada categoría antes de sumarla al catálogo.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium">Categorías</h3>
          <ul className="flex flex-col gap-2">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/products?category=${category.slug}`}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium">Ayuda</h3>
          <ul className="flex flex-col gap-2">
            <li>
              <Link href="/products" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Envíos y entregas
              </Link>
            </li>
            <li>
              <Link href="/products" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Cambios y devoluciones
              </Link>
            </li>
            <li>
              <Link href="/products" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Garantía
              </Link>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium">Legal</h3>
          <ul className="flex flex-col gap-2">
            <li>
              <Link href="/products" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Términos y condiciones
              </Link>
            </li>
            <li>
              <Link href="/products" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Privacidad
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border px-4 py-6">
        <p className="mx-auto max-w-6xl text-xs text-muted-foreground">
          Voltio es un proyecto de demostración. Los precios y productos son ilustrativos.
        </p>
      </div>
    </footer>
  );
}
