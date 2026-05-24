import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const ACCESS_PIN_UNLOCK_COOKIE = "porttools_access_pin_unlock";

export type AccessPinUnlockPayload = {
  authPortId: string;
  movementsPortId: string;
};

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET must be set (min 16 characters)");
  }
  return new TextEncoder().encode(secret);
}

export async function verifyAccessPinUnlockToken(
  token: string
): Promise<AccessPinUnlockPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (
      typeof payload.authPortId === "string" &&
      typeof payload.movementsPortId === "string"
    ) {
      return {
        authPortId: payload.authPortId,
        movementsPortId: payload.movementsPortId,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function hasAccessPinUnlock(
  authPortId: string,
  movementsPortId: string
): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_PIN_UNLOCK_COOKIE)?.value;
  if (!token) return false;

  const unlock = await verifyAccessPinUnlockToken(token);
  if (!unlock) return false;

  return (
    unlock.authPortId === authPortId && unlock.movementsPortId === movementsPortId
  );
}

export async function setAccessPinUnlockCookie(
  payload: AccessPinUnlockPayload
): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secretKey());

  const cookieStore = await cookies();
  cookieStore.set(ACCESS_PIN_UNLOCK_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function clearAccessPinUnlockCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_PIN_UNLOCK_COOKIE);
}
