import { cn } from "./cn";

type BrandTitleProps = {
  productName: string;
  className?: string;
};

export function BrandTitle({ productName, className }: BrandTitleProps) {
  return (
    <div className={cn("text-center", className)}>
      <h1 className="leading-tight tracking-tight">
        <span className="block text-3xl font-bold text-slate-900 sm:text-4xl">
          Precision Aviation Services
        </span>
        <span className="mt-2 block text-xl font-medium text-slate-600 sm:text-2xl">
          {productName}
        </span>
      </h1>
    </div>
  );
}
