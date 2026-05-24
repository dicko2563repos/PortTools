"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "./Button";
import { Input } from "./Input";

export type LoginMode = "port" | "admin" | "reports";

export type LoginFormProps = {
  mode: LoginMode;
  portLoginEndpoint?: string;
  adminLoginEndpoint?: string;
  reportsLoginEndpoint?: string;
  portRedirect?: string;
  adminRedirect?: string;
  reportsRedirect?: string;
};

export function LoginForm({
  mode,
  portLoginEndpoint = "/api/auth/port/login",
  adminLoginEndpoint = "/api/auth/admin/login",
  reportsLoginEndpoint = "/api/auth/reports/login",
  portRedirect = "/port/record",
  adminRedirect = "/admin",
  reportsRedirect = "/reports",
}: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const endpoint =
      mode === "port"
        ? portLoginEndpoint
        : mode === "admin"
          ? adminLoginEndpoint
          : reportsLoginEndpoint;
    const body =
      mode === "port"
        ? { code: form.get("code"), password: form.get("password") }
        : { email: form.get("email"), password: form.get("password") };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      setLoading(false);
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Login failed");
      return;
    }

    router.push(
      mode === "port" ? portRedirect : mode === "admin" ? adminRedirect : reportsRedirect
    );
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {mode === "port" ? (
        <label className="flex flex-col gap-1 text-sm">
          Port code
          <Input
            name="code"
            required
            autoComplete="username"
            placeholder="KGC"
          />
        </label>
      ) : (
        <label className="flex flex-col gap-1 text-sm">
          Email
          <Input name="email" type="email" required autoComplete="username" />
        </label>
      )}
      <label className="flex flex-col gap-1 text-sm">
        Password
        <Input
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading} className="py-2">
        {loading ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
