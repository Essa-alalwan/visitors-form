import { ArrowUpDown } from "lucide-react";
import { inputBaseClass, inputBorderClass } from "./FieldShell";

export function SortSelect<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly T[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={`${inputBaseClass} ${inputBorderClass(false)} appearance-none pl-9 pr-8`}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            Sort: {option}
          </option>
        ))}
      </select>
      <ArrowUpDown
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      />
    </div>
  );
}
