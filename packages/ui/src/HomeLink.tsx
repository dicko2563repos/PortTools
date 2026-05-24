"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "./cn";

type HomeLinkProps = {
  href?: string;
  className?: string;
};

export function HomeLink({ href = "/", className }: HomeLinkProps) {
  const [pending, setPending] = useState(false);

  return (
    <Link
      href={href}
      onClick={() => setPending(true)}
      aria-busy={pending}
      className={cn(
        "text-sm text-slate-500 transition-colors hover:text-slate-800 active:text-slate-900",
        pending && "cursor-wait text-slate-700 opacity-70",
        className
      )}
    >
      {pending ? "← Home…" : "← Home"}
    </Link>
  );
}
