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

/** True if anything is invalid anywhere inside one item of a field array
 * (nested attachment fields included) — regardless of which exact field.
 * Used to flag a collapsed repeatable card that has an unfixed error
 * hiding underneath its summary. */
export function hasItemErrors(
  errors: FieldErrors,
  arrayName: string,
  index: number,
): boolean {
  const itemErrors = (errors as Record<string, unknown>)?.[arrayName] as
    | Record<number, unknown>
    | undefined;
  const entry = itemErrors?.[index];
  return entry != null && typeof entry === "object" && Object.keys(entry).length > 0;
}
