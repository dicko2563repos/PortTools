"use client";

import type { InputHTMLAttributes } from "react";
import { Button } from "./Button";

export function SecretInputRow({
  label,
  value,
  onChange,
  onGenerate,
  hint,
  ...inputProps
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  hint?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "className">) {
  return (
    <label className="block text-sm">
      {label}
      <div className="mt-1 flex gap-2">
        <input
          {...inputProps}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1 font-mono text-sm"
        />
        <Button type="button" variant="secondary" className="shrink-0 px-3 py-1 text-sm" onClick={onGenerate}>
          Generate
        </Button>
      </div>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </label>
  );
}
