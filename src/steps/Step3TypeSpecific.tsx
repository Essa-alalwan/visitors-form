import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { StepCard } from "../components/layout/StepCard";
import { WizardNav } from "../components/layout/WizardNav";
import { TextAreaField } from "../components/fields/TextAreaField";
import { VisitorsSection } from "./sections/VisitorsSection";
import { MaterialSection } from "./sections/MaterialSection";
import { EquipmentSection } from "./sections/EquipmentSection";
import { useStepValidation } from "../hooks/useStepValidation";
import { useFormWizard } from "../context/FormWizardContext";
import type { FormValues } from "../schemas/formSchema";

const TITLES: Record<string, { title: string; description: string }> = {
  visitors: {
    title: "Visitor Details",
    description: "Add everyone who will be visiting and their documents.",
  },
  material: {
    title: "Material Entry & Exit Details",
    description: "Add the material request details and each item.",
  },
  equipment: {
    title: "Equipment Details",
    description: "Add each piece of equipment coming on site.",
  },
};

export function Step3TypeSpecific() {
  const { goNext, goBack } = useFormWizard();
  const { validateStep } = useStepValidation();
  const { watch, getValues, setValue } = useFormContext<FormValues>();
  const requestType = watch("requestType");

  useEffect(() => {
    if (requestType === "material" && !getValues("materialDetails")) {
      setValue("materialDetails", {
        createdBy: "",
        substanceDestination: "",
        driverReceiverId: "",
        companyAddress: "",
        vehiclePlateNo: "",
      });
    }
    if (requestType === "equipment" && !getValues("equipmentDetails")) {
      setValue("equipmentDetails", {
        createdBy: "",
        cprExpiryDate: undefined,
      });
    }
  }, [requestType, getValues, setValue]);

  async function handleNext() {
    if (await validateStep(3)) goNext();
  }

  if (!requestType) return null;
  const copy = TITLES[requestType];

  return (
    <StepCard title={copy.title} description={copy.description}>
      <TextAreaField
        name="visitPurpose"
        label="Visit Purpose"
        required
        rows={3}
      />

      {requestType === "visitors" && <VisitorsSection />}
      {requestType === "material" && <MaterialSection />}
      {requestType === "equipment" && <EquipmentSection />}

      <WizardNav onNext={handleNext} onBack={goBack} />
    </StepCard>
  );
}
