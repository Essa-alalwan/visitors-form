import { Check } from "lucide-react";
import { STEP_LABELS } from "../../utils/constants";

export function ProgressIndicator({
  step,
  totalSteps,
}: {
  step: number;
  totalSteps: number;
}) {
  const percent = ((step - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="mb-6 sm:mb-8">
      <div className="mb-2 flex items-center justify-between text-sm font-medium text-slate-500">
        <span>
          Step {step} of {totalSteps}
        </span>
        <span className="text-primary-700">{STEP_LABELS[step - 1]}</span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-700 transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      <ol className="mt-3 hidden justify-between sm:flex">
        {STEP_LABELS.map((label, index) => {
          const stepNum = index + 1;
          const state =
            stepNum < step ? "done" : stepNum === step ? "active" : "todo";
          return (
            <li key={label} className="flex items-center gap-1.5 text-xs">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold transition-colors ${
                  state === "done"
                    ? "bg-primary-600 text-white"
                    : state === "active"
                      ? "bg-primary-100 text-primary-700 ring-2 ring-primary-500"
                      : "bg-slate-200 text-slate-500"
                }`}
              >
                {state === "done" ? <Check className="h-3 w-3" /> : stepNum}
              </span>
              <span
                className={
                  state === "todo" ? "text-slate-400" : "text-slate-600"
                }
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
