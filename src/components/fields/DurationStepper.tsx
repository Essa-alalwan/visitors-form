import { useFormContext } from "react-hook-form";
import { Minus, Plus } from "lucide-react";
import { FieldShell } from "./FieldShell";

interface DurationStepperProps {
  hoursName: string;
  minutesName: string;
  label: string;
  helperText?: string;
}

function StepperControl({
  name,
  suffix,
  min,
  max,
  step = 1,
}: {
  name: string;
  suffix: string;
  min: number;
  max: number;
  step?: number;
}) {
  const { watch, setValue } = useFormContext();
  const value: number = watch(name) ?? 0;

  function update(next: number) {
    const clamped = Math.min(Math.max(next, min), max);
    setValue(name, clamped, { shouldDirty: true });
  }

  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5">
      <button
        type="button"
        onClick={() => update(value - step)}
        aria-label={`Decrease ${suffix}`}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary-700 focus-visible:outline-2 focus-visible:outline-primary-600"
      >
        <Minus className="h-4 w-4" />
      </button>
      <div className="w-16 text-center">
        <span className="text-lg font-semibold tabular-nums text-slate-900">
          {String(value).padStart(2, "0")}
        </span>
        <span className="ml-1 text-xs text-slate-500">{suffix}</span>
      </div>
      <button
        type="button"
        onClick={() => update(value + step)}
        aria-label={`Increase ${suffix}`}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary-700 focus-visible:outline-2 focus-visible:outline-primary-600"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

export function DurationStepper({
  hoursName,
  minutesName,
  label,
  helperText,
}: DurationStepperProps) {
  return (
    <FieldShell label={label} helperText={helperText}>
      <div className="flex flex-wrap gap-3">
        <StepperControl name={hoursName} suffix="hrs" min={0} max={999} />
        <StepperControl
          name={minutesName}
          suffix="min"
          min={0}
          max={45}
          step={15}
        />
      </div>
    </FieldShell>
  );
}
