import { useFormContext } from "react-hook-form";
import { FieldShell, inputBaseClass, inputBorderClass } from "./FieldShell";
import { getFieldError } from "../../utils/getFieldError";

interface TextAreaFieldProps {
  name: string;
  label: string;
  required?: boolean;
  helperText?: string;
  placeholder?: string;
  rows?: number;
}

export function TextAreaField({
  name,
  label,
  required,
  helperText,
  placeholder,
  rows = 4,
}: TextAreaFieldProps) {
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
      <textarea
        id={name}
        rows={rows}
        placeholder={placeholder}
        aria-invalid={!!error}
        className={`${inputBaseClass} ${inputBorderClass(!!error)} resize-none`}
        {...register(name)}
      />
    </FieldShell>
  );
}
