"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "./Button";
import { Input } from "./Input";

export type AdminResetPasswordFormProps = {
  token: string;
  endpoint?: string;
  loginHref?: string;
};

export function AdminResetPasswordForm({
  token,
  endpoint = "/api/auth/admin/reset-password",
  loginHref = "/login/admin",
}: AdminResetPasswordFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const newPassword = String(form.get("newPassword") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (newPassword !== confirmPassword) {
      setLoading(false);
      setError("Passwords do not match.");
      return;
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });

    if (!res.ok) {
      setLoading(false);
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Reset failed");
      return;
    }

    router.push(loginHref);
    router.refresh();
  }

  if (!token) {
    return (
      <p className="text-sm text-red-600">
        This reset link is invalid.{" "}
        <Link href="/login/admin/forgot" className="underline">
          Request a new one
        </Link>
        .
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        New password
        <Input
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Confirm new password
        <Input
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading} className="py-2">
        {loading ? "Updating…" : "Set new password"}
      </Button>
    </form>
  );
}
