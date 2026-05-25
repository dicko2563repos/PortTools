import {
  createOperatorSessionToken,
  PORTTOOLS_SESSION_COOKIE,
  porttoolsSessionCookieOptions,
  type OperatorSessionPayload,
} from "@porttools/auth";
import { cookies } from "next/headers";

export async function setPorttoolsSessionCookie(
  payload: OperatorSessionPayload
): Promise<void> {
  const token = await createOperatorSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(PORTTOOLS_SESSION_COOKIE, token, porttoolsSessionCookieOptions());
}

export async function clearPorttoolsSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  const options = porttoolsSessionCookieOptions();
  cookieStore.delete({
    name: PORTTOOLS_SESSION_COOKIE,
    path: "/",
    ...(options.domain ? { domain: options.domain } : {}),
  });
}
