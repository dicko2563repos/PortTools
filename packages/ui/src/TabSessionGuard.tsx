"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { hasTabSession } from "./tab-session";

export type TabSessionGuardProps = {
  storageKey: string;
  loginPath?: string;
  logoutEndpoint?: string;
  children: React.ReactNode;
};

function isLoginRoute(pathname: string, loginPath: string): boolean {
  return pathname === loginPath || pathname.startsWith(`${loginPath}/`);
}

export function TabSessionGuard({
  storageKey,
  loginPath = "/login",
  logoutEndpoint = "/api/auth/logout",
  children,
}: TabSessionGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState(true);

  useLayoutEffect(() => {
    if (isLoginRoute(pathname, loginPath)) {
      setAllowed(true);
      return;
    }

    if (!hasTabSession(storageKey)) {
      setAllowed(false);
      void fetch(logoutEndpoint, { method: "POST" }).finally(() => {
        router.replace(loginPath);
        router.refresh();
      });
      return;
    }

    setAllowed(true);
  }, [pathname, storageKey, loginPath, logoutEndpoint, router]);

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}
