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

// Bounds the year dropdown to a relevant range (today .. +20 years) instead
// of react-datepicker's default, which centers on/behind the current year —
// leaving the actually-useful near-future years buried below a scroll of
// old, irrelevant ones. Doesn't hide an already-set value outside this
// range (e.g. a past request's already-expired date still displays); it
// only bounds what can be newly picked going forward.
function yearBounds() {
  const today = new Date();
  const maxDate = new Date(today);
  maxDate.setFullYear(maxDate.getFullYear() + 20);
  return { minDate: today, maxDate };
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
  const { minDate, maxDate } = yearBounds();

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
              minDate={minDate}
              maxDate={maxDate}
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
