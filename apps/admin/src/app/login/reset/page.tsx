import { AdminResetPasswordForm, PlatformHomeLink } from "@porttools/ui";
import Link from "next/link";

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function AdminResetPasswordPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = params.token?.trim() ?? "";

  return (
    <main className="relative mx-auto max-w-md p-8">
      <PlatformHomeLink className="absolute left-8 top-8" />
      <h1 className="mt-4 text-xl font-semibold">Set new admin password</h1>
      <p className="mt-1 text-sm text-slate-600">Choose a new password for your admin account.</p>
      <div className="mt-6">
        <AdminResetPasswordForm token={token} loginHref="/login" />
      </div>
      <p className="mt-6 text-sm text-slate-600">
        <Link href="/login" className="text-slate-900 underline hover:no-underline">
          Back to admin login
        </Link>
      </p>
    </main>
  );
}
