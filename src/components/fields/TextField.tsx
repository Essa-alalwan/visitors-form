import { useFormContext } from "react-hook-form";
import { FieldShell, inputBaseClass, inputBorderClass } from "./FieldShell";
import { getFieldError } from "../../utils/getFieldError";

interface TextFieldProps {
  name: string;
  label: string;
  required?: boolean;
  helperText?: string;
  placeholder?: string;
  type?: "text" | "email" | "tel";
  disabled?: boolean;
}

export function TextField({
  name,
  label,
  required,
  helperText,
  placeholder,
  type = "text",
  disabled,
}: TextFieldProps) {
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
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        aria-invalid={!!error}
        disabled={disabled}
        className={`${inputBaseClass} ${inputBorderClass(!!error)} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500`}
        {...register(name)}
      />
    </FieldShell>
  );
}
