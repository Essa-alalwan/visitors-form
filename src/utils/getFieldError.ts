import type { FieldErrors } from "react-hook-form";

export function getFieldError(
  errors: FieldErrors,
  name: string,
): string | undefined {
  const path = name.split(".");
  let current: unknown = errors;
  for (const key of path) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  if (
    current &&
    typeof current === "object" &&
    "message" in current &&
    typeof (current as { message?: unknown }).message === "string"
  ) {
    return (current as { message: string }).message;
  }
  return undefined;
}
