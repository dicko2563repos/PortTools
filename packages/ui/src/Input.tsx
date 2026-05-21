import { cn } from "./cn";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn("rounded border border-slate-300 px-3 py-2", className)}
      {...props}
    />
  );
}
