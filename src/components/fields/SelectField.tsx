import { useFormContext } from "react-hook-form";
import { ChevronDown } from "lucide-react";
import { FieldShell, inputBaseClass, inputBorderClass } from "./FieldShell";
import { getFieldError } from "../../utils/getFieldError";

interface SelectFieldProps {
  name: string;
  label: string;
  options: readonly string[];
  required?: boolean;
  helperText?: string;
  placeholder?: string;
}

export function SelectField({
  name,
  label,
  options,
  required,
  helperText,
  placeholder = "Select an option",
}: SelectFieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const error = getFieldError(errors, name);

  return (
    <FieldShell
      label={label}
      htmlFor={name}
      required={required}
      helperText={helperText}
      error={error}
    >
      <div className="relative">
        <select
          id={name}
          defaultValue=""
          aria-invalid={!!error}
          className={`${inputBaseClass} ${inputBorderClass(!!error)} appearance-none pr-10`}
          {...register(name)}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
      </div>
    </FieldShell>
  );
}
