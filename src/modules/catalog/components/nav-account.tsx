import Link from "next/link";
import { LogOut, Package, Shield, User } from "lucide-react";

import { auth } from "@/auth";
import { logout } from "@/app/actions/auth";

/**
 * Zona de cuenta del navbar. Server Component: lee la sesión en cada
 * request, así que el estado logueado/no logueado siempre está en sincro
 * con la sesión real (antes el link "Ingresar" estaba hardcodeado y nunca
 * reflejaba que había un usuario adentro).
 */
export async function NavAccount() {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    return (
      <Link
        href="/login"
        className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:inline-flex"
      >
        <User className="size-4" aria-hidden />
        Ingresar
      </Link>
    );
  }

  return (
    <div className="hidden items-center gap-1 sm:flex">
      {user.role === "ADMIN" && (
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Shield className="size-4" aria-hidden />
          Admin
        </Link>
      )}
      <Link
        href="/orders"
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Package className="size-4" aria-hidden />
        Mis pedidos
      </Link>
      <form action={logout}>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <LogOut className="size-4" aria-hidden />
          Salir
        </button>
      </form>
    </div>
  );
}
