"use client";

import { useState } from "react";
import { Button } from "./Button";
import { Input } from "./Input";

export type AdminForgotPasswordFormProps = {
  endpoint?: string;
};

export function AdminForgotPasswordForm({
  endpoint = "/api/auth/admin/forgot-password",
}: AdminForgotPasswordFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email") }),
    });

    if (!res.ok) {
      setLoading(false);
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Request failed");
      return;
    }

    e.currentTarget.reset();
    setMessage(
      "If an account exists for that email, a reset link has been sent. Check your inbox."
    );
    // Keep loading state — nothing further to wait for, but avoid flicker if user navigates
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Admin email
        <Input name="email" type="email" required autoComplete="username" />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}
      <Button type="submit" disabled={loading} className="py-2">
        {loading ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
