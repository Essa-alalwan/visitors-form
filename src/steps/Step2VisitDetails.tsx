import { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { StepCard } from "../components/layout/StepCard";
import { WizardNav } from "../components/layout/WizardNav";
import { TextField } from "../components/fields/TextField";
import { SelectField } from "../components/fields/SelectField";
import { DateTimeField } from "../components/fields/DateTimeField";
import { DurationStepper } from "../components/fields/DurationStepper";
import { VerifyEmailModal } from "../components/profile/VerifyEmailModal";
import { DEPARTMENTS } from "../utils/constants";
import { useStepValidation } from "../hooks/useStepValidation";
import { useFormWizard } from "../context/FormWizardContext";
import { useProfile } from "../context/ProfileContext";
import type { FormValues } from "../schemas/formSchema";

export function Step2VisitDetails() {
  const { goNext, goBack } = useFormWizard();
  const { validateStep } = useStepValidation();
  const { isVerified, email } = useProfile();
  const { getValues, setValue } = useFormContext<FormValues>();

  // Returning/verified users already proved their email before entering
  // the wizard — this gate only applies to guests. Tracks which exact
  // email was last verified so changing it forces a re-check.
  const [showVerify, setShowVerify] = useState(false);
  const verifiedEmailRef = useRef<string | null>(null);

  // A verified returning user already proved they own this email at
  // login — lock Contact Email to it so it can't be swapped for someone
  // else's address, and there's nothing left to re-verify at this step.
  useEffect(() => {
    if (isVerified && email) {
      setValue("contactEmail", email, { shouldValidate: true });
    }
  }, [isVerified, email, setValue]);

  async function handleNext() {
    if (!(await validateStep(2))) return;

    if (isVerified) {
      goNext();
      return;
    }

    const contactEmail = getValues("contactEmail");
    if (verifiedEmailRef.current === contactEmail) {
      goNext();
      return;
    }

    setShowVerify(true);
  }

  function handleVerified() {
    verifiedEmailRef.current = getValues("contactEmail");
    setShowVerify(false);
    goNext();
  }

  return (
    <StepCard
      title="Visit & Requester Details"
      description="Tell us when you're visiting and who to contact you about."
    >
      <DateTimeField name="visitDateTime" label="Visit Date & Time" required />
      <DurationStepper
        hoursName="visitDurationHours"
        minutesName="visitDurationMinutes"
        label="Visit Duration"
        helperText="Optional — expected length of the visit"
      />
      <TextField name="companyName" label="Company Name" required />
      <TextField
        name="contactEmail"
        label="Contact Email"
        type="email"
        required
        disabled={isVerified}
        helperText={
          isVerified
            ? "This is your verified sign-in email — status notifications will be sent here."
            : "Email of requester — status notifications will be sent here. You'll need to verify you own it before continuing."
        }
      />
      <TextField
        name="aldurContactPerson"
        label="Aldur II Contact Person"
        required
        helperText="The internal ACWA employee being visited"
      />
      <SelectField
        name="department"
        label="Department"
        options={DEPARTMENTS}
        required
      />

      <WizardNav onNext={handleNext} onBack={goBack} />

      <VerifyEmailModal
        email={getValues("contactEmail") || ""}
        open={showVerify}
        onVerified={handleVerified}
        onCancel={() => setShowVerify(false)}
      />
    </StepCard>
  );
}
