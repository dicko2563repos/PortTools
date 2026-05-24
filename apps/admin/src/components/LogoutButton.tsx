"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, clearTabSession, TAB_SESSION_KEYS } from "@porttools/ui";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onLogout() {
    setBusy(true);
    clearTabSession(TAB_SESSION_KEYS.admin);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <Button type="button" variant="secondary" disabled={busy} onClick={onLogout}>
      {busy ? "Signing out…" : "Sign out"}
    </Button>
  );
}
