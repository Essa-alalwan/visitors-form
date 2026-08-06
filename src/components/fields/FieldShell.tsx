import type { ReactNode } from "react";
import { FieldError } from "../feedback/FieldError";

interface FieldShellProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  children: ReactNode;
}

export function FieldShell({
  label,
  htmlFor,
  required,
  helperText,
  error,
  children,
}: FieldShellProps) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium text-slate-700"
      >
        {label}
        {required && <span className="ml-0.5 text-primary-600">*</span>}
      </label>
      {children}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-slate-500">{helperText}</p>
      )}
      <FieldError message={error} />
    </div>
  );
}

export const inputBaseClass =
  "w-full rounded-xl border bg-white px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40";

export function inputBorderClass(hasError?: boolean) {
  return hasError
    ? "border-red-300 focus:border-red-400"
    : "border-slate-200 focus:border-primary-500";
}
