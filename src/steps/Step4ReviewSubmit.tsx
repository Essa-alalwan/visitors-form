import { useState } from "react";
import { useFormContext, type FieldPath } from "react-hook-form";
import { Send } from "lucide-react";
import { StepCard } from "../components/layout/StepCard";
import { TextAreaField } from "../components/fields/TextAreaField";
import { CheckboxField } from "../components/fields/CheckboxField";
import { ReviewSummary } from "../components/review/ReviewSummary";
import { LoadingOverlay } from "../components/feedback/LoadingOverlay";
import { SuccessScreen } from "../components/feedback/SuccessScreen";
import { TermsModal } from "../components/legal/TermsModal";
import { useStepValidation } from "../hooks/useStepValidation";
import { useFormWizard } from "../context/FormWizardContext";
import { useProfile } from "../context/ProfileContext";
import { submitRequest } from "../data/submitRequest";
import { buildSubmissionPayload } from "../utils/buildSubmissionPayload";
import { clearDraft } from "../utils/draftStorage";
import { scrollToField } from "../utils/scrollToField";
import {
  formSchema,
  getCrossFieldIssues,
  STEP_FIELD_NAMES,
  type FormValues,
} from "../schemas/formSchema";

function findEarliestStepWithIssue(
  issues: { path: string[] }[],
): number | null {
  let earliest: number | null = null;
  for (const issue of issues) {
    const field = issue.path[0];
    for (const [stepStr, fields] of Object.entries(STEP_FIELD_NAMES)) {
      if ((fields as string[]).includes(field)) {
        const step = Number(stepStr);
        if (earliest === null || step < earliest) earliest = step;
        break;
      }
    }
  }
  return earliest;
}

export function Step4ReviewSubmit() {
  const {
    goBack,
    goToStep,
    submissionStatus,
    setSubmissionStatus,
    referenceNumber,
    setReferenceNumber,
    reset: resetWizard,
  } = useFormWizard();
  const { validateStep } = useStepValidation();
  const {
    getValues,
    setError,
    clearErrors,
    reset: resetFormValues,
  } = useFormContext<FormValues>();
  const { refreshHistory } = useProfile();

  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [showTerms, setShowTerms] = useState(false);

  async function onSubmit(values: FormValues) {
    setSubmissionStatus("submitting");
    setSubmissionError(null);
    try {
      const payload = buildSubmissionPayload(values, referenceNumber);
      const result = await submitRequest(payload);
      if (result.success) {
        setReferenceNumber(result.requestId);
        setSubmissionStatus("success");
        refreshHistory();
        // A successful submission's draft would otherwise still be sitting
        // in IndexedDB and get restored into what looks like a new request
        // the next time this tab refreshes.
        clearDraft();
      } else {
        setSubmissionError(result.error);
        setSubmissionStatus("error");
      }
    } catch {
      setSubmissionError(
        "Something went wrong submitting your request. Please try again.",
      );
      setSubmissionStatus("error");
    }
  }

  async function handleSubmitClick() {
    if (!(await validateStep(4))) return;

    // Full-form safety net: re-validate everything (not just this step's
    // fields) directly against the schema before actually submitting.
    const values = getValues();
    const parseResult = formSchema.safeParse(values);
    const fieldIssues = parseResult.success
      ? []
      : parseResult.error.issues.map((i) => ({
          path: i.path.map(String),
          message: i.message,
        }));
    const allIssues = [...fieldIssues, ...getCrossFieldIssues(values)];

    clearErrors();
    if (allIssues.length > 0) {
      let firstErrorPath: string | null = null;
      for (const issue of allIssues) {
        const path = issue.path.join(".");
        if (path) {
          if (!firstErrorPath) firstErrorPath = path;
          setError(path as FieldPath<FormValues>, {
            type: "custom",
            message: issue.message,
          });
        }
      }
      // Some failing fields (e.g. PPE confirmation) may live on an earlier
      // step than the one currently shown — jump there so the error is
      // actually visible instead of silently blocking submission.
      const earliestStep = findEarliestStepWithIssue(allIssues);
      if (earliestStep !== null && earliestStep < 4) {
        goToStep(earliestStep);
      }
      if (firstErrorPath) scrollToField(firstErrorPath);
      return;
    }
    onSubmit(values);
  }

  if (submissionStatus === "success" && referenceNumber) {
    return (
      <SuccessScreen
        referenceNumber={referenceNumber}
        contactEmail={getValues("contactEmail")}
        onEdit={() => setSubmissionStatus("idle")}
        onReset={() => {
          resetFormValues();
          resetWizard();
        }}
      />
    );
  }

  return (
    <div className="relative">
      <StepCard
        title="Purpose, Remarks & Review"
        description="Confirm everything below before submitting your request."
      >
        <TextAreaField
          name="visitPurpose"
          label="Visit Purpose"
          required
          rows={3}
        />
        <TextAreaField
          name="requestRemarks"
          label="Request Remarks"
          placeholder="Optional"
          rows={3}
        />

        <ReviewSummary />

        {submissionStatus === "error" && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {submissionError ??
              "Something went wrong submitting your request. Please try again."}
          </p>
        )}

        <CheckboxField
          name="agreeToTerms"
          required
          label={
            <>
              I agree to the{" "}
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="font-semibold text-primary-700 underline underline-offset-2 hover:text-primary-800"
              >
                Terms & Conditions
              </button>
            </>
          }
        />

        <div className="mt-6 flex items-center justify-between gap-3 sm:mt-8">
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleSubmitClick}
            disabled={submissionStatus === "submitting"}
            className="flex items-center gap-1.5 rounded-xl bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-accent-500/30 transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Send className="h-4 w-4" />
            Submit Request
          </button>
        </div>
      </StepCard>

      {submissionStatus === "submitting" && <LoadingOverlay />}
      <TermsModal open={showTerms} onClose={() => setShowTerms(false)} />
    </div>
  );
}
