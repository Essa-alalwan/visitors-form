import type { ReactNode } from "react";

export function SummarySection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-800">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function SummaryRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5 text-sm sm:flex-row sm:justify-between sm:gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800 sm:text-left">
        {value}
      </span>
    </div>
  );
}
