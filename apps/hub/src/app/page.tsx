import { BrandTitle, LoginForm } from "@porttools/ui";
import { HubHomeRedirect } from "@/components/HubHomeRedirect";
import { SUPPORT_EMAIL } from "@/lib/app-urls";

export default function HomePage() {
  return (
    <main className="relative mx-auto max-w-md p-8">
      <HubHomeRedirect />
      <BrandTitle productName="PortTools" className="mt-4" />
      <p className="mt-4 text-center text-sm text-slate-600">
        Sign in with your port or reports email and password.
      </p>
      <div className="mt-6">
        <LoginForm mode="operator" operatorRedirect="/portal" />
      </div>
      <p className="mt-4 text-center text-sm text-slate-600">
        Platform admin?{" "}
        <a
          href="https://admin.porttools.com.au/login"
          className="text-slate-900 underline hover:no-underline"
        >
          Admin console
        </a>
        . Need help?{" "}
        <a
          href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("PortTools login help")}`}
          className="text-slate-900 underline hover:no-underline"
        >
          {SUPPORT_EMAIL}
        </a>
      </p>
    </main>
  );
}
