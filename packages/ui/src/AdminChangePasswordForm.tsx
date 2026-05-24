"use client";

import { useState } from "react";
import { Button } from "./Button";
import { Card } from "./Card";
import { Input } from "./Input";

export type AdminChangePasswordFormProps = {
  endpoint?: string;
};

export function AdminChangePasswordForm({
  endpoint = "/api/admin/change-password",
}: AdminChangePasswordFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const currentPassword = String(form.get("currentPassword") ?? "");
    const newPassword = String(form.get("newPassword") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (newPassword !== confirmPassword) {
      setLoading(false);
      setError("New passwords do not match.");
      return;
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Password could not be changed.");
      return;
    }

    e.currentTarget.reset();
    setMessage("Password updated.");
  }

  return (
    <Card className="p-6">
      <h2 className="mb-4 text-lg font-medium">Change password</h2>
      <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Current password
          <Input
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
          />
        </label>
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
        {message && <p className="text-sm text-green-700">{message}</p>}
        <Button type="submit" disabled={loading} className="self-start px-4 py-2">
          {loading ? "Updating…" : "Update password"}
        </Button>
      </form>
    </Card>
  );
}
