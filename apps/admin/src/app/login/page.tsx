import { ForgotPasswordHelp, PlatformHomeLink, LoginForm } from "@porttools/ui";
import { isResendConfigured } from "@porttools/auth";
import { SUPPORT_EMAIL } from "@/lib/support";

export default function AdminLoginPage() {
  const emailResetAvailable = isResendConfigured();

  return (
    <main className="relative mx-auto max-w-md p-8">
      <PlatformHomeLink className="absolute left-8 top-8" />
      <h1 className="mt-4 text-xl font-semibold">Admin console</h1>
      <p className="mt-1 text-sm text-slate-600">Platform administration for PortTools apps.</p>
      <div className="mt-6">
        <LoginForm mode="admin" adminRedirect="/console" />
        <ForgotPasswordHelp
          mode="admin"
          supportEmail={SUPPORT_EMAIL}
          emailResetAvailable={emailResetAvailable}
          adminForgotHref="/login/forgot"
        />
      </div>
    </main>
  );
}
