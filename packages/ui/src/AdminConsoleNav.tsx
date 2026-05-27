"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "./cn";

export type AdminConsoleNavProps = {
  accessAppUrl: string;
};

const TAB_CLASS =
  "rounded px-3 py-1 text-sm transition-colors";

export function AdminConsoleNav({ accessAppUrl }: AdminConsoleNavProps) {
  const pathname = usePathname();

  function tabClass(href: string, activePrefixes: string[]) {
    const active = activePrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
    return cn(
      TAB_CLASS,
      active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
    );
  }

  return (
    <nav className="mb-8 flex flex-wrap gap-2 border-b border-slate-200 pb-3 text-sm">
      <Link href="/console/platform" className={tabClass("/console/platform", ["/console/platform", "/console"])}>
        Platform
      </Link>
      <Link href="/console/pcr" className={tabClass("/console/pcr", ["/console/pcr"])}>
        PCR
      </Link>
      <Link href="/console/pms" className={tabClass("/console/pms", ["/console/pms"])}>
        PMS
      </Link>
      <a
        href={accessAppUrl}
        className={cn(TAB_CLASS, "bg-slate-100 text-slate-700 hover:bg-slate-200")}
      >
        Open Access register →
      </a>
    </nav>
  );
}
