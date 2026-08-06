import { StepCard } from "../components/layout/StepCard";
import { WizardNav } from "../components/layout/WizardNav";
import { RequestTypeSelector } from "../components/requestType/RequestTypeSelector";
import { useStepValidation } from "../hooks/useStepValidation";
import { useFormWizard } from "../context/FormWizardContext";

export function Step1RequestType() {
  const { goNext } = useFormWizard();
  const { validateStep } = useStepValidation();

  async function handleNext() {
    if (await validateStep(1)) goNext();
  }

  return (
    <StepCard
      title="What do you need access for?"
      description="Choose the type of request you're submitting — this determines the details we'll ask for next."
    >
      <RequestTypeSelector />
      <WizardNav onNext={handleNext} showBack={false} nextLabel="Continue" />
    </StepCard>
  );
}
