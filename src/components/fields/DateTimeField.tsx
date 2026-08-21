import { Controller, useFormContext } from "react-hook-form";
import DatePicker from "react-datepicker";
import { CalendarClock } from "lucide-react";
import { FieldShell, inputBaseClass, inputBorderClass } from "./FieldShell";
import { getFieldError } from "../../utils/getFieldError";

interface DateTimeFieldProps {
  name: string;
  label: string;
  required?: boolean;
  helperText?: string;
  showTime?: boolean;
}

export function DateTimeField({
  name,
  label,
  required,
  helperText,
  showTime = true,
}: DateTimeFieldProps) {
  const {
    control,
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
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <DatePicker
              id={name}
              selected={field.value ?? null}
              onChange={(date: Date | null) => field.onChange(date)}
              onBlur={field.onBlur}
              showTimeSelect={showTime}
              timeIntervals={15}
              showYearDropdown
              showMonthDropdown
              dropdownMode="select"
              dateFormat={showTime ? "d MMM yyyy, h:mm aa" : "d MMM yyyy"}
              placeholderText={
                showTime ? "Choose a date and time" : "Choose a date"
              }
              wrapperClassName="w-full"
              className={`${inputBaseClass} ${inputBorderClass(!!error)} pr-10`}
            />
          )}
        />
        <CalendarClock
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
      </div>
    </FieldShell>
  );
}
