import type { LoginMode } from "./LoginForm";

type ForgotPasswordHelpProps = {
  mode: LoginMode;
  supportEmail: string;
};

export function ForgotPasswordHelp({ mode, supportEmail }: ForgotPasswordHelpProps) {
  const mailto = `mailto:${supportEmail}?subject=${encodeURIComponent(
    mode === "port" ? "Port login — password help" : "Admin login — password help"
  )}`;

  return (
    <p className="mt-4 text-sm text-slate-600">
      <span className="font-medium text-slate-700">Forgot password?</span>{" "}
      {mode === "port" ? (
        <>
          Contact{" "}
          <a href={mailto} className="text-slate-900 underline hover:no-underline">
            {supportEmail}
          </a>
          . An admin can reset your port&apos;s shared password in the admin panel.
        </>
      ) : (
        <>
          Contact{" "}
          <a href={mailto} className="text-slate-900 underline hover:no-underline">
            {supportEmail}
          </a>
          . A system administrator can reset admin access for you.
        </>
      )}
    </p>
  );
}
