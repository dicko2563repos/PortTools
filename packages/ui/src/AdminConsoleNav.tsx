"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "./cn";

export type AdminConsoleNavProps = {
  accessAppUrl: string;
  pmsReportsUrl: string;
};

const TAB_CLASS =
  "rounded px-3 py-1 text-sm transition-colors";

const LINK_CLASS = cn(TAB_CLASS, "bg-slate-100 text-slate-700 hover:bg-slate-200");

export function AdminConsoleNav({ accessAppUrl, pmsReportsUrl }: AdminConsoleNavProps) {
  const pathname = usePathname();

  function tabClass(activePrefixes: string[]) {
    const active = activePrefixes.some((prefix) => {
      if (prefix === "/console") {
        return pathname === "/console";
      }
      return pathname === prefix || pathname.startsWith(`${prefix}/`);
    });
    return cn(
      TAB_CLASS,
      active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
    );
  }

  return (
    <nav className="mb-8 flex flex-wrap gap-2 border-b border-slate-200 pb-3 text-sm">
      <Link href="/console/platform" className={tabClass(["/console/platform", "/console"])}>
        Platform
      </Link>
      <Link href="/console/pcr" className={tabClass(["/console/pcr"])}>
        PCR
      </Link>
      <a href={pmsReportsUrl} className={LINK_CLASS}>
        Open movement reports →
      </a>
      <a href={accessAppUrl} className={LINK_CLASS}>
        Open Access register →
      </a>
    </nav>
  );
}
