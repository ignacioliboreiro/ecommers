import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const GUEST_COOKIE_NAME = "cart_guest_id";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 días

function secret(): string {
  const value = process.env.NEXTAUTH_SECRET;
  if (!value) throw new Error("NEXTAUTH_SECRET no está definido.");
  return value;
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

// Formato de cookie: "<guestId>.<hmac>" — la firma evita que un cliente
// invente un guestId ajeno y se apropie de otro carrito de invitado.
function serialize(guestId: string): string {
  return `${guestId}.${sign(guestId)}`;
}

function verify(raw: string | undefined): string | null {
  if (!raw) return null;
  const sep = raw.lastIndexOf(".");
  if (sep <= 0) return null;

  const guestId = raw.slice(0, sep);
  const signature = raw.slice(sep + 1);
  const expected = sign(guestId);

  const sigBuf = Buffer.from(signature, "hex");
  const expBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expBuf)) return null;

  return guestId;
}

/** Lee el guestId válido de la cookie, o null si no hay / la firma no valida. */
export async function readGuestId(): Promise<string | null> {
  const cookieStore = await cookies();
  return verify(cookieStore.get(GUEST_COOKIE_NAME)?.value);
}

/**
 * Devuelve el guestId existente o crea uno nuevo y setea la cookie firmada.
 * Solo se puede llamar desde Server Actions / Route Handlers (escribe cookie).
 */
export async function ensureGuestId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = verify(cookieStore.get(GUEST_COOKIE_NAME)?.value);
  if (existing) return existing;

  const guestId = randomUUID();
  cookieStore.set(GUEST_COOKIE_NAME, serialize(guestId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  return guestId;
}

export async function clearGuestCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(GUEST_COOKIE_NAME);
}
