import { FormProvider, useForm } from "react-hook-form";
import { AppShell } from "./components/layout/AppShell";
import { ProgressIndicator } from "./components/layout/ProgressIndicator";
import { StepTransition } from "./components/layout/StepTransition";
import { FormWizardProvider, useFormWizard } from "./context/FormWizardContext";
import type { FormValues } from "./schemas/formSchema";
import { Step1RequestType } from "./steps/Step1RequestType";
import { Step2VisitDetails } from "./steps/Step2VisitDetails";
import { Step3TypeSpecific } from "./steps/Step3TypeSpecific";
import { Step4ReviewSubmit } from "./steps/Step4ReviewSubmit";

const defaultValues: FormValues = {
  requestType: undefined,
  visitDateTime: undefined,
  visitDurationHours: 0,
  visitDurationMinutes: 0,
  companyName: "",
  contactEmail: "",
  aldurContactPerson: "",
  department: "",
  visitPurpose: "",
  requestRemarks: "",
  visitKind: undefined,
  visitors: [],
  materialDetails: undefined,
  materials: [],
  equipment: [],
};

function WizardSteps() {
  const { step, direction, totalSteps } = useFormWizard();

  return (
    <>
      <ProgressIndicator step={step} totalSteps={totalSteps} />
      <StepTransition stepKey={step} direction={direction}>
        {step === 1 && <Step1RequestType />}
        {step === 2 && <Step2VisitDetails />}
        {step === 3 && <Step3TypeSpecific />}
        {step === 4 && <Step4ReviewSubmit />}
      </StepTransition>
    </>
  );
}

function App() {
  const methods = useForm<FormValues>({
    defaultValues,
    mode: "onBlur",
  });

  return (
    <AppShell>
      <FormProvider {...methods}>
        <FormWizardProvider>
          <WizardSteps />
        </FormWizardProvider>
      </FormProvider>
    </AppShell>
  );
}

export default App;
