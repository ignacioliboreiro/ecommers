import * as z from "zod";

export const LoginSchema = z.object({
  email: z.email({ error: "Ingresá un email válido." }).trim().toLowerCase(),
  password: z.string().min(1, { error: "Ingresá tu contraseña." }),
});

export const RegisterSchema = z.object({
  name: z
    .string()
    .min(2, { error: "El nombre debe tener al menos 2 caracteres." })
    .trim(),
  email: z.email({ error: "Ingresá un email válido." }).trim().toLowerCase(),
  password: z
    .string()
    .min(8, { error: "Debe tener al menos 8 caracteres." })
    .regex(/[a-zA-Z]/, { error: "Debe contener al menos una letra." })
    .regex(/[0-9]/, { error: "Debe contener al menos un número." }),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
