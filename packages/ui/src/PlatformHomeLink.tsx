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
  return (
    <a
      href={href}
      className={className ?? "text-sm text-slate-500 hover:text-slate-800"}
    >
      {label}
    </a>
  );
}
