"use client";

import { TabSessionGuard } from "./TabSessionGuard";

export type PortTabSessionGateProps = {
  storageKey: string;
  requireTabSession: boolean;
  children: React.ReactNode;
};

/** Tab-scoped logout for direct PCR/PMS port logins without "until next Monday". */
export function PortTabSessionGate({
  storageKey,
  requireTabSession,
  children,
}: PortTabSessionGateProps) {
  return (
    <TabSessionGuard storageKey={storageKey} loginPath="/" enabled={requireTabSession}>
      {children}
    </TabSessionGuard>
  );
}
