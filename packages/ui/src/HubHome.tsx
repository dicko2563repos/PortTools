import { Card } from "./Card";
import { cn } from "./cn";

export type HubAppLink = {
  name: string;
  description: string;
  href: string;
  status?: "live" | "pilot";
};

export type HubHomeProps = {
  apps?: HubAppLink[];
  supportEmail?: string;
  className?: string;
};

export const DEFAULT_HUB_APPS: HubAppLink[] = [
  {
    name: "Port Compliance Record",
    description: "Yearly compliance inspections and archive for port operators.",
    href: "https://pcr.porttools.com.au",
    status: "live",
  },
  {
    name: "Port Movement Summary",
    description: "Bi-weekly aircraft movement entry and reporting.",
    href: "https://pms.porttools.com.au",
    status: "live",
  },
  {
    name: "PTS Calc",
    description: "KPI times throughout an aircraft turnaround.",
    href: "https://ptscalc.porttools.com.au",
    status: "live",
  },
];

const statusLabel: Record<NonNullable<HubAppLink["status"]>, string> = {
  live: "Live",
  pilot: "Pilot",
};

export function HubHome({
  apps = DEFAULT_HUB_APPS,
  supportEmail = "kgc@precisionaviation.com.au",
  className,
}: HubHomeProps) {
  return (
    <main
      className={cn(
        "mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-10 p-8",
        className
      )}
    >
      <div className="text-center">
        <h1 className="leading-tight tracking-tight">
          <span className="block text-3xl font-bold text-slate-900 sm:text-4xl">
            Precision Aviation Services
          </span>
          <span className="mt-2 block text-xl font-medium text-slate-600 sm:text-2xl">
            PortTools
          </span>
        </h1>
        <p className="mt-4 text-sm text-slate-600">
          Choose an app to sign in or open a tool. Each app has its own port and admin login.
        </p>
      </div>

      <ul className="flex flex-col gap-4">
        {apps.map((app) => (
          <li key={app.href}>
            <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-900">{app.name}</h2>
                  {app.status && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {statusLabel[app.status]}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-600">{app.description}</p>
              </div>
              <a
                href={app.href}
                className="shrink-0 rounded-lg bg-slate-900 px-4 py-2.5 text-center text-sm text-white hover:bg-slate-800"
              >
                Open app
              </a>
            </Card>
          </li>
        ))}
      </ul>

      <p className="text-center text-sm text-slate-600">
        Need help signing in?{" "}
        <a
          href={`mailto:${supportEmail}`}
          className="font-medium text-slate-900 underline-offset-2 hover:underline"
        >
          {supportEmail}
        </a>
      </p>
    </main>
  );
}
