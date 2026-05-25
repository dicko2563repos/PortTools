import { PORTTOOLS_SESSION_COOKIE } from "@porttools/auth";
import { TabSessionGuard, TAB_SESSION_KEYS } from "@porttools/ui";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";

export async function AccessTabSessionGate({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const cookieStore = await cookies();
  const hasPorttoolsSession = !!cookieStore.get(PORTTOOLS_SESSION_COOKIE)?.value;

  // Hub iframe SSO sets porttools_session on access.porttools.com.au — skip access tab gate
  // (sessionStorage tab keys do not cross subdomains from porttools.com.au).
  const requireTabSession =
    !session || (session.type === "manager" && !hasPorttoolsSession);

  return (
    <TabSessionGuard storageKey={TAB_SESSION_KEYS.access} enabled={requireTabSession}>
      {children}
    </TabSessionGuard>
  );
}
