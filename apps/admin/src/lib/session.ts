import {
  adminSessionCookieOptions,
  createAdminSessionToken,
  PORTTOOLS_ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
  type AdminSessionPayload,
} from "@porttools/auth";
import { cookies } from "next/headers";

export const SESSION_COOKIE = PORTTOOLS_ADMIN_SESSION_COOKIE;
export type SessionPayload = AdminSessionPayload;

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return createAdminSessionToken(payload);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  return verifyAdminSessionToken(token);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await createSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, adminSessionCookieOptions());
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
