"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { auth, signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { LoginSchema, RegisterSchema } from "@/lib/validations/auth";
import { mergeGuestCartIntoUser } from "@/src/modules/cart/actions/merge-guest-cart";

export type FormState =
  | {
      errors?: {
        name?: string[];
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

export async function login(
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  try {
    // redirect: false para poder fusionar el carrito de invitado antes de salir.
    await signIn("credentials", { ...validatedFields.data, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { message: "Email o contraseña incorrectos." };
    }
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { email: validatedFields.data.email },
    select: { id: true },
  });
  if (user) await mergeGuestCartIntoUser(user.id);

  redirect("/");
}

export async function register(
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { name, email, password } = validatedFields.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { errors: { email: ["Ya existe una cuenta con este email."] } };
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { message: "Cuenta creada. Iniciá sesión manualmente." };
    }
    throw error;
  }

  await mergeGuestCartIntoUser(user.id);

  redirect("/");
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}
