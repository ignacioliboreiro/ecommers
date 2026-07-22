import type { ReactNode } from "react";

import { CategoryNav } from "@/src/modules/catalog/components/category-nav";

export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <CategoryNav />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
