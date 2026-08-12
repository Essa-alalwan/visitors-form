import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { TOTAL_STEPS } from "../utils/constants";

export type SubmissionStatus = "idle" | "submitting" | "success" | "error";

interface FormWizardContextValue {
  step: number;
  direction: 1 | -1;
  totalSteps: number;
  maxStepReached: number;
  goNext: () => void;
  goBack: () => void;
  goToStep: (step: number) => void;
  submissionStatus: SubmissionStatus;
  setSubmissionStatus: (status: SubmissionStatus) => void;
  referenceNumber: string | null;
  setReferenceNumber: (ref: string | null) => void;
  reset: () => void;
}

const FormWizardContext = createContext<FormWizardContextValue | null>(null);

export function FormWizardProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [maxStepReached, setMaxStepReached] = useState(1);
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>("idle");
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);

  const value = useMemo<FormWizardContextValue>(
    () => ({
      step,
      direction,
      totalSteps: TOTAL_STEPS,
      maxStepReached,
      goNext: () =>
        setStep((s) => {
          setDirection(1);
          const next = Math.min(s + 1, TOTAL_STEPS);
          setMaxStepReached((m) => Math.max(m, next));
          return next;
        }),
      goBack: () =>
        setStep((s) => {
          setDirection(-1);
          return Math.max(s - 1, 1);
        }),
      goToStep: (target: number) =>
        setStep((s) => {
          setDirection(target >= s ? 1 : -1);
          const next = Math.min(Math.max(target, 1), TOTAL_STEPS);
          setMaxStepReached((m) => Math.max(m, next));
          return next;
        }),
      submissionStatus,
      setSubmissionStatus,
      referenceNumber,
      setReferenceNumber,
      reset: () => {
        setStep(1);
        setDirection(1);
        setMaxStepReached(1);
        setSubmissionStatus("idle");
        setReferenceNumber(null);
      },
    }),
    [step, direction, maxStepReached, submissionStatus, referenceNumber],
  );

  return (
    <FormWizardContext.Provider value={value}>
      {children}
    </FormWizardContext.Provider>
  );
}

export function useFormWizard() {
  const ctx = useContext(FormWizardContext);
  if (!ctx) {
    throw new Error("useFormWizard must be used within a FormWizardProvider");
  }
  return ctx;
}
