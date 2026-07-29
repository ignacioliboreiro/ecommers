import type { Metadata } from "next";

import { AuthShell } from "@/components/auth-shell";

import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Crear cuenta",
};

export default function RegisterPage() {
  return (
    <AuthShell title="Crear cuenta" description="Registrate para guardar tus pedidos y direcciones.">
      <RegisterForm />
    </AuthShell>
  );
}
