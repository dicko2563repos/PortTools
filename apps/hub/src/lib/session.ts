import {
  createOperatorSessionToken,
  PORTTOOLS_SESSION_COOKIE,
  porttoolsSessionCookieOptions,
  verifyOperatorSessionToken,
  type OperatorSessionPayload,
} from "@porttools/auth";
import { cookies } from "next/headers";

export { PORTTOOLS_SESSION_COOKIE };
export type SessionPayload = OperatorSessionPayload;

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PORTTOOLS_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyOperatorSessionToken(token);
}

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await createOperatorSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(PORTTOOLS_SESSION_COOKIE, token, porttoolsSessionCookieOptions());
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete({
    name: PORTTOOLS_SESSION_COOKIE,
    path: "/",
    ...(porttoolsSessionCookieOptions().domain
      ? { domain: porttoolsSessionCookieOptions().domain }
      : {}),
  });
}
