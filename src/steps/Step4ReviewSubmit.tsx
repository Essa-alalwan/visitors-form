import { useFormContext, type FieldPath } from "react-hook-form";
import { Send } from "lucide-react";
import { StepCard } from "../components/layout/StepCard";
import { TextAreaField } from "../components/fields/TextAreaField";
import { ReviewSummary } from "../components/review/ReviewSummary";
import { LoadingOverlay } from "../components/feedback/LoadingOverlay";
import { SuccessScreen } from "../components/feedback/SuccessScreen";
import { useStepValidation } from "../hooks/useStepValidation";
import { useFormWizard } from "../context/FormWizardContext";
import { submitRequest } from "../data/submitRequest";
import { buildSubmissionPayload } from "../utils/buildSubmissionPayload";
import { formSchema, type FormValues } from "../schemas/formSchema";

export function Step4ReviewSubmit() {
  const {
    goBack,
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

  async function onSubmit(values: FormValues) {
    setSubmissionStatus("submitting");
    try {
      const payload = buildSubmissionPayload(values);
      const result = await submitRequest(payload);
      if (result.success) {
        setReferenceNumber(result.referenceNumber);
        setSubmissionStatus("success");
      } else {
        setSubmissionStatus("error");
      }
    } catch {
      setSubmissionStatus("error");
    }
  }

  async function handleSubmitClick() {
    if (!(await validateStep(4))) return;

    // Full-form safety net: re-validate everything (not just this step's
    // fields) directly against the schema before actually submitting.
    const result = formSchema.safeParse(getValues());
    clearErrors();
    if (!result.success) {
      for (const issue of result.error.issues) {
        const path = issue.path.join(".");
        if (path) {
          setError(path as FieldPath<FormValues>, {
            type: "custom",
            message: issue.message,
          });
        }
      }
      return;
    }
    onSubmit(result.data as FormValues);
  }

  if (submissionStatus === "success" && referenceNumber) {
    return (
      <SuccessScreen
        referenceNumber={referenceNumber}
        contactEmail={getValues("contactEmail")}
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
            Something went wrong submitting your request. Please try again.
          </p>
        )}

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
    </div>
  );
}
