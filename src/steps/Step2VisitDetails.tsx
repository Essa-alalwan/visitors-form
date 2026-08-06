import { StepCard } from "../components/layout/StepCard";
import { WizardNav } from "../components/layout/WizardNav";
import { TextField } from "../components/fields/TextField";
import { SelectField } from "../components/fields/SelectField";
import { DateTimeField } from "../components/fields/DateTimeField";
import { DurationStepper } from "../components/fields/DurationStepper";
import { DEPARTMENTS } from "../utils/constants";
import { useStepValidation } from "../hooks/useStepValidation";
import { useFormWizard } from "../context/FormWizardContext";

export function Step2VisitDetails() {
  const { goNext, goBack } = useFormWizard();
  const { validateStep } = useStepValidation();

  async function handleNext() {
    if (await validateStep(2)) goNext();
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
        helperText="Email of requester (status notifications will be sent here)"
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
    </StepCard>
  );
}
