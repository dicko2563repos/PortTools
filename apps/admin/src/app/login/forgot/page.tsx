import { PlatformHomeLink, AdminForgotPasswordForm } from "@porttools/ui";
import { isResendConfigured } from "@porttools/auth";
import Link from "next/link";
import { SUPPORT_EMAIL } from "@/lib/support";

export default function AdminForgotPasswordPage() {
  const emailResetAvailable = isResendConfigured();

  return (
    <main className="relative mx-auto max-w-md p-8">
      <PlatformHomeLink className="absolute left-8 top-8" />
      <h1 className="mt-4 text-xl font-semibold">Reset admin password</h1>
      {emailResetAvailable ? (
        <>
          <p className="mt-1 text-sm text-slate-600">
            Enter your admin email and we&apos;ll send a reset link (valid for 1 hour).
          </p>
          <div className="mt-6">
            <AdminForgotPasswordForm endpoint="/api/auth/admin/forgot-password" />
          </div>
        </>
      ) : (
        <p className="mt-2 text-sm text-slate-600">
          Email reset is not configured. Contact{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Admin login — password help")}`}
            className="text-slate-900 underline hover:no-underline"
          >
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      )}
      <p className="mt-6 text-sm text-slate-600">
        <Link href="/login" className="text-slate-900 underline hover:no-underline">
          Back to admin login
        </Link>
      </p>
    </main>
  );
}
