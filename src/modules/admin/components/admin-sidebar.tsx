"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart } from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Productos", icon: Package, exact: false },
  { href: "/admin/orders", label: "Pedidos", icon: ShoppingCart, exact: false },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    // En mobile es una fila horizontal con scroll propio (como un tab bar) en
    // vez de la columna fija de 224px de desktop: esa columna, en un viewport
    // de ~390px, se comía más de la mitad de la pantalla y no dejaba espacio
    // usable para el contenido (dashboard, tablas, forms).
    <nav className="flex w-full shrink-0 gap-1 overflow-x-auto border-b border-border p-2 md:w-56 md:flex-col md:overflow-visible md:border-r md:border-b-0 md:p-4">
      {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
