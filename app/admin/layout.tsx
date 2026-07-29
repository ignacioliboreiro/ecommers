import { redirect } from "next/navigation";
import { LogOut, Zap } from "lucide-react";

import { auth } from "@/auth";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { AdminSidebar } from "@/src/modules/admin/components/admin-sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // proxy.ts ya protege /admin exigiendo role === "ADMIN", pero un doble
  // chequeo server-side acá es gratis y consistente con el resto del código
  // (ver app/(storefront)/orders/[id]/page.tsx).
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    // `flex-1` y no `min-h-screen`: el <body> ya es `min-h-full flex-col`, y con
    // el banner de modo demo arriba un `min-h-screen` acá desbordaría la ventana.
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-2 font-semibold">
          <Zap className="size-4 text-primary" aria-hidden />
          Panel admin
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">{session.user.name ?? session.user.email}</span>
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm">
              <LogOut data-icon="inline-start" aria-hidden />
              Salir
            </Button>
          </form>
        </div>
      </header>
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
