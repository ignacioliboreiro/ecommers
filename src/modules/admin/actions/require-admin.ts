import "server-only";

import type { Role } from "@prisma/client";

import { auth } from "@/auth";

export interface AdminSessionUser {
  id: string;
  role: Role;
  name: string | null;
  email: string;
}

/**
 * Toda Server Action del panel admin llama esto primero. Tira una excepción
 * en vez de devolver un flag — así una action que se olvide de chequear el
 * resultado falla ruidosamente en vez de seguir con datos de admin sin
 * autorización real. proxy.ts protege las rutas /admin, pero una Server
 * Action puede invocarse directo (bypasseando la ruta), así que esto es la
 * verificación real.
 */
export async function requireAdmin(): Promise<AdminSessionUser> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("No autorizado.");
  }
  return {
    id: session.user.id,
    role: session.user.role,
    name: session.user.name ?? null,
    email: session.user.email ?? "",
  };
}
