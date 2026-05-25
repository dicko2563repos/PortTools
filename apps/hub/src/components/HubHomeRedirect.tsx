"use client";

import { hasTabSession, TAB_SESSION_KEYS } from "@porttools/ui";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Client-only redirect when this tab already has an active hub session. */
export function HubHomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (!hasTabSession(TAB_SESSION_KEYS.hub)) return;

    void fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { authenticated?: boolean } | null) => {
        if (data?.authenticated) {
          router.replace("/portal");
        }
      });
  }, [router]);

  return null;
}
