import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm, useFormContext, useWatch } from "react-hook-form";
import { History } from "lucide-react";
import { AppShell } from "./components/layout/AppShell";
import { ProgressIndicator } from "./components/layout/ProgressIndicator";
import { StepTransition } from "./components/layout/StepTransition";
import { FormWizardProvider, useFormWizard } from "./context/FormWizardContext";
import { ProfileProvider, useProfile } from "./context/ProfileContext";
import { EntryGate } from "./components/profile/EntryGate";
import { HistoryModal } from "./components/profile/HistoryModal";
import { getRequestDetail } from "./data/profileApi";
import { detailToFormValues } from "./utils/detailToFormValues";
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
  bringPPE: false,
  materialDetails: undefined,
  materials: [],
  equipment: [],
  equipmentDetails: undefined,
  agreeToTerms: false,
};

/** Prefills the non-array reusable fields (company name, material/equipment
 * details) from a verified returning user's saved profile once the request
 * type they're on is known. Visitor-specific prefill happens separately
 * inside VisitorsSection, since that array only exists once it mounts. */
function ProfilePrefill() {
  const { profile, isVerified } = useProfile();
  const { setValue } = useFormContext<FormValues>();
  const requestType = useWatch<FormValues, "requestType">({ name: "requestType" });
  const applied = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isVerified || !profile || !requestType) return;
    if (applied.current.has(requestType)) return;
    applied.current.add(requestType);

    if (profile.companyName) {
      setValue("companyName", profile.companyName, { shouldDirty: false });
    }

    if (requestType === "material") {
      if (profile.driverReceiverId) {
        setValue("materialDetails.driverReceiverId", profile.driverReceiverId);
      }
      if (profile.vehiclePlateNo) {
        setValue("materialDetails.vehiclePlateNo", profile.vehiclePlateNo);
      }
      if (profile.companyAddress) {
        setValue("materialDetails.companyAddress", profile.companyAddress);
      }
    }

    if (requestType === "equipment") {
      if (profile.equipmentCreatedBy) {
        setValue("equipmentDetails.createdBy", profile.equipmentCreatedBy);
      }
      if (profile.equipmentCprExpiryDate) {
        setValue("equipmentDetails.cprExpiryDate", new Date(profile.equipmentCprExpiryDate));
      }
    }
  }, [requestType, isVerified, profile, setValue]);

  return null;
}

function WizardSteps() {
  const { step, direction, totalSteps, goToStep, setReferenceNumber, setSubmissionStatus } =
    useFormWizard();
  const { isVerified, email, sessionToken, history } = useProfile();
  const { reset } = useFormContext<FormValues>();
  const [showHistory, setShowHistory] = useState(false);

  async function handleOpenRequest(
    requestId: string,
    mode: "edit" | "duplicate",
  ): Promise<boolean> {
    if (!email || !sessionToken) return false;

    const result = await getRequestDetail(email, sessionToken, requestId);
    if (!result.ok) return false;

    const values = detailToFormValues(result.detail);
    reset({ ...defaultValues, ...values } as FormValues);
    // Editing carries the original ID forward so resubmitting updates the
    // same request; duplicating leaves it unset so resubmitting creates a
    // brand new request and the original stays untouched.
    setReferenceNumber(mode === "edit" ? requestId : null);
    setSubmissionStatus("idle");
    // Edit jumps to Visit Details (step 2) so they can double check/adjust
    // the visit itself; Resubmit skips straight to Review & Submit (step 4)
    // since it's meant to be a quick "same as before, send it again".
    goToStep(mode === "edit" ? 2 : 4);
    setShowHistory(false);
    return true;
  }

  return (
    <>
      <ProfilePrefill />
      {isVerified && (
        <button
          type="button"
          onClick={() => setShowHistory(true)}
          className="mb-4 flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-primary-300 bg-primary-50 px-4 py-3.5 text-left shadow-sm transition-colors hover:border-primary-400 hover:bg-primary-100"
        >
          <span className="flex items-center gap-2.5">
            <History className="h-5 w-5 text-primary-700" />
            <span className="text-sm font-semibold text-primary-800">
              My Requests
            </span>
          </span>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-primary-700 ring-1 ring-primary-200">
            {history.length} past {history.length === 1 ? "request" : "requests"}
          </span>
        </button>
      )}
      <ProgressIndicator step={step} totalSteps={totalSteps} />
      <StepTransition stepKey={step} direction={direction}>
        {step === 1 && <Step1RequestType />}
        {step === 2 && <Step2VisitDetails />}
        {step === 3 && <Step3TypeSpecific />}
        {step === 4 && <Step4ReviewSubmit />}
      </StepTransition>
      <HistoryModal
        open={showHistory}
        onClose={() => setShowHistory(false)}
        onEditRequest={(id) => handleOpenRequest(id, "edit")}
        onDuplicateRequest={(id) => handleOpenRequest(id, "duplicate")}
      />
    </>
  );
}

function Gated() {
  const { entryChoice, isVerified } = useProfile();
  const pastGate = entryChoice === "guest" || isVerified;

  return pastGate ? <WizardSteps /> : <EntryGate />;
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
          <ProfileProvider>
            <Gated />
          </ProfileProvider>
        </FormWizardProvider>
      </FormProvider>
    </AppShell>
  );
}

export default App;
