"use client";

import { hasTabSession, TAB_SESSION_KEYS } from "@porttools/ui";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";

const PIN_RECONCILED_KEY = "porttools_access_pin_reconciled";

/**
 * PIN unlock cookie survives tab close; require a matching access-origin tab session
 * before trusting the cookie (mirrors hub TabSessionGuard).
 */
export function AccessPinTabGuard({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    if (hasTabSession(TAB_SESSION_KEYS.accessPin)) {
      setReady(true);
      return;
    }

    if (sessionStorage.getItem(PIN_RECONCILED_KEY) === "1") {
      setReady(true);
      return;
    }

    void fetch("/api/access/pin-unlock", { method: "DELETE" }).finally(() => {
      sessionStorage.setItem(PIN_RECONCILED_KEY, "1");
      setReady(true);
      router.refresh();
    });
  }, [router]);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}

export function markAccessPinTabActive(): void {
  sessionStorage.removeItem(PIN_RECONCILED_KEY);
}
