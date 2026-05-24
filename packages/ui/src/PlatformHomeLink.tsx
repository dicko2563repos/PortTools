"use client";

import { useState } from "react";
import { cn } from "./cn";

export type PlatformHomeLinkProps = {
  href?: string;
  label?: string;
  className?: string;
};

export function PlatformHomeLink({
  href = "https://porttools.com.au",
  label = "← PortTools home",
  className,
}: PlatformHomeLinkProps) {
  const [pending, setPending] = useState(false);

  return (
    <a
      href={href}
      onClick={() => setPending(true)}
      aria-busy={pending}
      className={cn(
        "text-sm text-slate-500 transition-colors hover:text-slate-800 active:text-slate-900",
        pending && "cursor-wait text-slate-700 opacity-70",
        className
      )}
    >
      {pending ? `${label}…` : label}
    </a>
  );
}
