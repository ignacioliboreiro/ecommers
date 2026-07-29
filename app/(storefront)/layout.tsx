import type { ReactNode } from "react";

import { CategoryNav } from "@/src/modules/catalog/components/category-nav";
import { Footer } from "@/src/modules/catalog/components/footer";
import { PageTransition } from "@/src/modules/layout/components/page-transition";

// El banner de modo demo se renderiza en el root layout (app/layout.tsx) para
// cubrir también la home, que no pasa por este layout.
export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <CategoryNav />
      <main className="flex flex-1 flex-col">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </div>
  );
}
