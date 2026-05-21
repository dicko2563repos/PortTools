import Link from "next/link";

type HomeLinkProps = {
  href?: string;
  className?: string;
};

export function HomeLink({ href = "/", className }: HomeLinkProps) {
  return (
    <Link
      href={href}
      className={className ?? "text-sm text-slate-500 hover:text-slate-800"}
    >
      ← Home
    </Link>
  );
}
