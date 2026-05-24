import { PlatformHomeLink, LoginForm } from "@porttools/ui";
import { SUPPORT_EMAIL } from "@/lib/support";

export default function ManagerLoginPage() {
  return (
    <main className="relative mx-auto max-w-md p-8">
      <PlatformHomeLink className="absolute left-8 top-8" />
      <h1 className="mt-4 text-xl font-semibold">Access register</h1>
      <p className="mt-1 text-sm text-slate-600">
        Manager login for staff ASIC and FOB registers at your assigned port(s).
      </p>
      <div className="mt-6">
        <LoginForm mode="manager" managerRedirect="/ports" />
      </div>
      <p className="mt-4 text-sm text-slate-600">
        Need an account? Contact{" "}
        <a
          href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Access register — manager account")}`}
          className="text-slate-900 underline hover:no-underline"
        >
          {SUPPORT_EMAIL}
        </a>
        . Platform admins can create manager accounts in the Admin console.
      </p>
    </main>
  );
}
