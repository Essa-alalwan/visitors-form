import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm, useFormContext, useWatch } from "react-hook-form";
import { History, AlertTriangle } from "lucide-react";
import { AppShell } from "./components/layout/AppShell";
import { ProgressIndicator } from "./components/layout/ProgressIndicator";
import { StepTransition } from "./components/layout/StepTransition";
import { FormWizardProvider, useFormWizard } from "./context/FormWizardContext";
import { ProfileProvider, useProfile } from "./context/ProfileContext";
import { EntryGate } from "./components/profile/EntryGate";
import { HistoryModal } from "./components/profile/HistoryModal";
import { DraftPersistence } from "./components/DraftPersistence";
import { ConfirmModal } from "./components/ConfirmModal";
import { getRequestDetail } from "./data/profileApi";
import { detailToFormValues } from "./utils/detailToFormValues";
import { clearDraft } from "./utils/draftStorage";
import { getExpiryStatus } from "./utils/expiryStatus";
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
      setValue("companyName", String(profile.companyName), { shouldDirty: false });
    }

    if (requestType === "material") {
      if (profile.driverReceiverId) {
        setValue("materialDetails.driverReceiverId", String(profile.driverReceiverId));
      }
      if (profile.vehiclePlateNo) {
        setValue("materialDetails.vehiclePlateNo", String(profile.vehiclePlateNo));
      }
      if (profile.companyAddress) {
        setValue("materialDetails.companyAddress", String(profile.companyAddress));
      }
    }

    if (requestType === "equipment") {
      if (profile.equipmentCreatedBy) {
        setValue("equipmentDetails.createdBy", String(profile.equipmentCreatedBy));
      }
      if (profile.equipmentCprExpiryDate) {
        setValue("equipmentDetails.cprExpiryDate", new Date(profile.equipmentCprExpiryDate));
      }
    }
  }, [requestType, isVerified, profile, setValue]);

  return null;
}

/** Warns a returning, verified user at login time if their saved CPR/
 * Passport or Equipment CPR expiry is coming up soon or has already
 * passed. Attachment-level expiry isn't covered here — attachments
 * belong to specific past requests, not the reusable saved profile, so
 * there's no profile-level source of truth to check at login. */
function ProfileExpiryBanner() {
  const { profile, isVerified } = useProfile();
  if (!isVerified || !profile) return null;

  const cprStatus = getExpiryStatus(profile.cprExpiryDate);
  const equipmentCprStatus = getExpiryStatus(profile.equipmentCprExpiryDate);

  const flagged = [
    cprStatus && cprStatus.tier !== "in-date"
      ? { label: "CPR/Passport", status: cprStatus }
      : null,
    equipmentCprStatus && equipmentCprStatus.tier !== "in-date"
      ? { label: "Equipment CPR", status: equipmentCprStatus }
      : null,
  ].filter((f): f is { label: string; status: NonNullable<typeof cprStatus> } => f !== null);

  if (flagged.length === 0) return null;

  const worst = flagged.some((f) => f.status.tier === "expired") ? "expired" : "expiring";
  const names = flagged.map((f) => `${f.label} (${f.status.label})`).join(", ");

  return (
    <div
      className={`mb-4 flex items-start gap-2.5 rounded-2xl border-2 px-4 py-3.5 text-sm ${
        worst === "expired"
          ? "border-red-300 bg-red-50 text-red-800"
          : "border-amber-300 bg-amber-50 text-amber-800"
      }`}
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
      <span>
        Your saved <strong>{names}</strong> — please update it on your next
        request.
      </span>
    </div>
  );
}

function WizardSteps() {
  const {
    step,
    direction,
    totalSteps,
    maxStepReached,
    goToStep,
    setReferenceNumber,
    setSubmissionStatus,
    reset: resetWizard,
  } = useFormWizard();
  const { isVerified, email, sessionToken, history, signOut } = useProfile();
  const { reset } = useFormContext<FormValues>();
  const [showHistory, setShowHistory] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"new" | "signOut" | null>(null);

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
    // Both edit and resubmit land on Visit Details so the user can
    // double check/adjust before continuing through the wizard.
    goToStep(2);
    setShowHistory(false);
    return true;
  }

  // Discards whatever's currently filled in (e.g. a past request loaded
  // via Edit/Duplicate) and goes back to a blank Step 1 — but leaves
  // login state untouched, so a signed-in returning user stays signed in.
  function performStartNewRequest() {
    reset(defaultValues);
    resetWizard();
    clearDraft();
  }

  // Same reset as above, plus signs out of whatever identity is
  // currently active (guest or verified returning user) so the person
  // lands back on the entry-choice screen — the only way out of "guest"
  // and into "Sign In" once already past that gate.
  function performSignOut() {
    reset(defaultValues);
    resetWizard();
    clearDraft();
    signOut();
  }

  function handleConfirmAction() {
    if (confirmAction === "new") performStartNewRequest();
    if (confirmAction === "signOut") performSignOut();
    setConfirmAction(null);
  }

  return (
    <>
      <ProfilePrefill />
      <ProfileExpiryBanner />
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
      <div className="mb-4 flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => setConfirmAction("new")}
          className="text-xs font-semibold text-slate-500 hover:text-slate-700"
        >
          New Request
        </button>
        <button
          type="button"
          onClick={() => setConfirmAction("signOut")}
          className="text-xs font-semibold text-slate-500 hover:text-slate-700"
        >
          Sign Out
        </button>
      </div>
      <ConfirmModal
        open={confirmAction !== null}
        title={confirmAction === "signOut" ? "Sign out?" : "Start a new request?"}
        message={
          confirmAction === "signOut"
            ? "This will clear everything you've filled in and sign you out."
            : "This will clear everything you've filled in so far."
        }
        confirmLabel={confirmAction === "signOut" ? "Sign Out" : "Start New Request"}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmAction(null)}
      />
      <ProgressIndicator
        step={step}
        totalSteps={totalSteps}
        maxStepReached={maxStepReached}
        onStepClick={goToStep}
      />
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
            <DraftPersistence />
            <Gated />
          </ProfileProvider>
        </FormWizardProvider>
      </FormProvider>
    </AppShell>
  );
}

export default App;
