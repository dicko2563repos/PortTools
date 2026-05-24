import Link from "next/link";
import { cn } from "./cn";
import { PlatformHomeLink } from "./PlatformHomeLink";

type AppHomeLinksProps = {
  productName: string;
  portLoginHref?: string;
  adminLoginHref?: string;
  reportsLoginHref?: string | null;
  platformHomeHref?: string | null;
  className?: string;
};

export function AppHomeLinks({
  productName,
  portLoginHref = "/login/port",
  adminLoginHref = "/login/admin",
  reportsLoginHref = null,
  platformHomeHref = "https://porttools.com.au",
  className,
}: AppHomeLinksProps) {
  return (
    <main
      className={cn(
        "relative mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-8 p-8",
        className
      )}
    >
      {platformHomeHref && (
        <PlatformHomeLink href={platformHomeHref} className="absolute left-8 top-8" />
      )}
      <div className="text-center">
        <h1 className="leading-tight tracking-tight">
          <span className="block text-3xl font-bold text-slate-900 sm:text-4xl">
            Precision Aviation Services
          </span>
          <span className="mt-2 block text-xl font-medium text-slate-600 sm:text-2xl">
            {productName}
          </span>
        </h1>
      </div>
      <nav className="flex flex-col gap-3">
        <Link
          href={portLoginHref}
          className="rounded-lg bg-slate-900 px-4 py-3 text-center text-white hover:bg-slate-800"
        >
          Port login
        </Link>
        <Link
          href={adminLoginHref}
          className="rounded-lg border border-slate-300 px-4 py-3 text-center hover:bg-white"
        >
          Admin login
        </Link>
        {reportsLoginHref && (
          <Link
            href={reportsLoginHref}
            className="rounded-lg border border-slate-300 px-4 py-3 text-center hover:bg-white"
          >
            Reports login
          </Link>
        )}
      </nav>
    </main>
  );
}
