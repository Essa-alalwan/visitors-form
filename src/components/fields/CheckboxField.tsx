import type { ReactNode } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { FieldError } from "../feedback/FieldError";
import { getFieldError } from "../../utils/getFieldError";

interface CheckboxFieldProps {
  name: string;
  label: ReactNode;
  required?: boolean;
}

export function CheckboxField({ name, label, required }: CheckboxFieldProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext();
  const error = getFieldError(errors, name);

  return (
    <div>
      <label className="flex items-start gap-2.5 text-sm text-slate-700">
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <input
              id={name}
              name={name}
              type="checkbox"
              checked={field.value ?? false}
              onChange={(e) => field.onChange(e.target.checked)}
              onBlur={field.onBlur}
              className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-slate-300 text-primary-600 focus:ring-2 focus:ring-primary-500/40"
            />
          )}
        />
        <span>
          {label}
          {required && <span className="ml-0.5 text-primary-600">*</span>}
        </span>
      </label>
      <FieldError message={error} />
    </div>
  );
}
