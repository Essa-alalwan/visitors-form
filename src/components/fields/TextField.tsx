import { useFormContext } from "react-hook-form";
import { FieldShell, inputBaseClass, inputBorderClass } from "./FieldShell";
import { getFieldError } from "../../utils/getFieldError";

interface TextFieldProps {
  name: string;
  label: string;
  required?: boolean;
  helperText?: string;
  placeholder?: string;
  type?: "text" | "email";
}

export function TextField({
  name,
  label,
  required,
  helperText,
  placeholder,
  type = "text",
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
        className={`${inputBaseClass} ${inputBorderClass(!!error)}`}
        {...register(name)}
      />
    </FieldShell>
  );
}
