"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import type { CategoryNavItem } from "@/src/modules/catalog/types/catalog";

export function NavLinks({ categories }: { categories: CategoryNavItem[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = pathname === "/products" ? searchParams.get("category") : null;
  const isAllActive = pathname === "/products" && !activeCategory;

  return (
    <ul className="flex items-center gap-1">
      <NavLink href="/products" active={isAllActive}>
        Todos
      </NavLink>
      {categories.map((category) => (
        <NavLink
          key={category.id}
          href={`/products?category=${category.slug}`}
          active={activeCategory === category.slug}
        >
          {category.name}
        </NavLink>
      ))}
    </ul>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group/nav-link relative inline-flex items-center px-3 py-2 text-sm font-medium transition-colors",
          active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {children}
        <span
          className={cn(
            "absolute inset-x-3 -bottom-px h-px origin-left scale-x-0 bg-primary transition-transform duration-300 ease-out group-hover/nav-link:scale-x-100",
            active && "scale-x-100"
          )}
        />
      </Link>
    </li>
  );
}
