import type { Metadata } from "next";

import { AuthShell } from "@/components/auth-shell";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Ingresar",
};

export default function LoginPage() {
  return (
    <AuthShell title="Ingresar" description="Ingresá con tu email y contraseña para continuar.">
      <LoginForm />
    </AuthShell>
  );
}
