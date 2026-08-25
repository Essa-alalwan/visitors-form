import { useFormContext } from "react-hook-form";
import { Minus, Plus } from "lucide-react";
import { FieldShell } from "./FieldShell";
import { getFieldError } from "../../utils/getFieldError";

interface DurationStepperProps {
  name: string;
  label: string;
  helperText?: string;
  required?: boolean;
}

export function DurationStepper({ name, label, helperText, required }: DurationStepperProps) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();
  const value: number = watch(name) ?? 0;
  const error = getFieldError(errors, name);

  function update(next: number) {
    const clamped = Math.min(Math.max(next, 0), 999);
    setValue(name, clamped, { shouldDirty: true });
  }

  return (
    <FieldShell label={label} htmlFor={name} helperText={helperText} required={required} error={error}>
      <div
        id={name}
        tabIndex={-1}
        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 focus:outline-none"
      >
        <button
          type="button"
          onClick={() => update(value - 1)}
          aria-label="Decrease hrs"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary-700 focus-visible:outline-2 focus-visible:outline-primary-600"
        >
          <Minus className="h-4 w-4" />
        </button>
        <div className="w-16 text-center">
          <span className="text-lg font-semibold tabular-nums text-slate-900">
            {String(value).padStart(2, "0")}
          </span>
          <span className="ml-1 text-xs text-slate-500">hrs</span>
        </div>
        <button
          type="button"
          onClick={() => update(value + 1)}
          aria-label="Increase hrs"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary-700 focus-visible:outline-2 focus-visible:outline-primary-600"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </FieldShell>
  );
}
