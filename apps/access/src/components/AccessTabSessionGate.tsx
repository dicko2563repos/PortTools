import { TabSessionGuard, TAB_SESSION_KEYS } from "@porttools/ui";
import { getSession } from "@/lib/session";

export async function AccessTabSessionGate({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const requireTabSession = !session || session.type === "manager";

  return (
    <TabSessionGuard storageKey={TAB_SESSION_KEYS.access} enabled={requireTabSession}>
      {children}
    </TabSessionGuard>
  );
}
