import type { FieldPath } from "react-hook-form";
import { useFormContext } from "react-hook-form";
import {
  STEP_FIELD_NAMES,
  formSchema,
  getCrossFieldIssues,
  type FormValues,
} from "../schemas/formSchema";

/**
 * react-hook-form's zodResolver-driven `trigger()` does not reliably clear a
 * field's error once it becomes valid (observed: a stale "required" message
 * persists after the field is filled, even though the resolver's own output
 * says the field is valid). Validating directly against the zod schema and
 * syncing the result into formState via setError/clearErrors sidesteps that
 * and is provably accurate against the schema at all times.
 *
 * Validation always runs against the full schema plus the cross-field rules
 * (some rules are cross-step, e.g. "visitors" is only required when
 * requestType is "visitors" — see getCrossFieldIssues), but only errors
 * belonging to *this* step's own fields are applied — otherwise every step
 * transition would prematurely flag fields on steps the user hasn't reached
 * yet.
 */
export function useStepValidation() {
  const { getValues, setError, clearErrors } = useFormContext<FormValues>();

  async function validateStep(step: number): Promise<boolean> {
    const fields = STEP_FIELD_NAMES[step];
    if (!fields) return true;

    const values = getValues();
    const parseResult = formSchema.safeParse(values);
    const fieldIssues = parseResult.success
      ? []
      : parseResult.error.issues.map((i) => ({
          path: i.path.map(String),
          message: i.message,
        }));
    const allIssues = [...fieldIssues, ...getCrossFieldIssues(values)];

    clearErrors(fields as FieldPath<FormValues>[]);

    let firstErrorPath: string | null = null;
    let isStepValid = true;
    for (const issue of allIssues) {
      if (!fields.includes(issue.path[0] as never)) continue;
      const path = issue.path.join(".");
      if (!path) continue;
      isStepValid = false;
      if (!firstErrorPath) firstErrorPath = path;
      setError(path as FieldPath<FormValues>, {
        type: "custom",
        message: issue.message,
      });
    }

    if (!isStepValid && firstErrorPath) {
      // Errors render after this render cycle commits; wait a tick before
      // scrolling so an off-screen error is never mistaken for "nothing happened".
      requestAnimationFrame(() => {
        const el =
          document.getElementsByName(firstErrorPath!)[0] ??
          document.getElementById(firstErrorPath!);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        if (el instanceof HTMLElement) el.focus({ preventScroll: true });
      });
    }

    return isStepValid;
  }

  return { validateStep };
}
