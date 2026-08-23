import { fetchJsonWithRetry } from "./fetchJsonWithRetry";

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

export interface RequesterProfileData {
  companyName?: string;
  visitorName?: string;
  cprOrPassport?: string;
  cprExpiryDate?: string;
  jobTitle?: string;
  driverReceiverId?: string;
  vehiclePlateNo?: string;
  companyAddress?: string;
  equipmentCreatedBy?: string;
  equipmentCprExpiryDate?: string;
  ppeConfirmed?: string;
}

export interface RequestHistoryEntry {
  requestId: string;
  requestType: string;
  visitKind?: string;
  visitDateTime?: string;
  status?: string;
  submittedAt?: string;
  // Real per-stage approval data, sourced from the same Requests sheet
  // columns the separate "Access App - Emails Only" project reads to
  // drive the approval-chain emails — distinct from the generic
  // `status` field above.
  deptStatus?: string;
  deptBy?: string;
  deptRemarks?: string;
  hsseStatus?: string;
  hsseBy?: string;
  hsseRemarks?: string;
}

export interface DetailAttachment {
  description: string;
  remarks?: string;
  existingPath: string;
  expiryDate?: string;
  // Read-only, auto-computed by the sheet — informational only, not
  // editable or resubmitted.
  docValidity?: string;
}

export interface RequestDetail {
  requestId: string;
  requestType: string;
  visitDateTime?: string;
  visitKind?: string;
  visitPurpose?: string;
  contactPerson?: string;
  department?: string;
  requestRemarks?: string;
  companyName?: string;
  contactEmail?: string;
  contactPhone?: string;
  visitDuration?: string;
  visitors?: {
    visitorName: string;
    cprPassport: string;
    jobTitle: string;
    cprExpiryDate?: string;
    attachments: DetailAttachment[];
  }[];
  mrCreatedBy?: string;
  substanceDestination?: string;
  driverId?: string;
  mrCompanyAddress?: string;
  vehiclePlateNo?: string;
  materials?: {
    inOut: string;
    returnable: string;
    description: string;
    quantity: string;
    uom: string;
    pat: string;
    remarks?: string;
    attachments: DetailAttachment[];
  }[];
  epCreatedBy?: string;
  epCprExpiryDate?: string;
  equipments?: {
    typeModel: string;
    plateNo: string;
    name: string;
    operatorLicenseNo: string;
    remarks?: string;
    attachments: DetailAttachment[];
  }[];
}

const GENERIC_ERROR =
  "Something went wrong. Please check your connection and try again.";

// Shown after retries are exhausted for the delivery-layer failure modes
// (as opposed to a real network error) — we now know these usually mean
// the action already went through and the response just didn't make it
// back, so the copy reflects that instead of blaming the connection.
const DELIVERY_ERROR =
  "We didn't get a clear response back after a few tries. If this was meant to send a code or load something, it may have already gone through — please check before trying again.";

async function postAction(body: Record<string, unknown>): Promise<
  { ok: true; data: Record<string, unknown> } | { ok: false; error: string }
> {
  if (!APPS_SCRIPT_URL) {
    return {
      ok: false,
      error: "The form isn't configured with a backend URL. Contact the site administrator.",
    };
  }

  const result = await fetchJsonWithRetry(APPS_SCRIPT_URL, body);
  if (!result.ok) {
    return {
      ok: false,
      error: result.reason === "network"
        ? "Couldn't reach the server. Check your internet connection and try again."
        : DELIVERY_ERROR,
    };
  }

  if (typeof result.data !== "object" || result.data === null) {
    return { ok: false, error: GENERIC_ERROR };
  }

  const data = result.data as Record<string, unknown>;
  if (data.ok === true) {
    return { ok: true, data };
  }

  const error = typeof data.error === "string" ? data.error : GENERIC_ERROR;
  return { ok: false, error };
}

export async function requestOtp(
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await postAction({ action: "requestOtp", email });
  if (!result.ok) return result;
  return { ok: true };
}

export async function verifyOtp(
  email: string,
  code: string,
): Promise<
  | { ok: true; sessionToken: string; profile: RequesterProfileData | null; history: RequestHistoryEntry[] }
  | { ok: false; error: string }
> {
  const result = await postAction({ action: "verifyOtp", email, code });
  if (!result.ok) return result;

  const { data } = result;
  return {
    ok: true,
    sessionToken: typeof data.sessionToken === "string" ? data.sessionToken : "",
    profile: (data.profile as RequesterProfileData | null) ?? null,
    history: Array.isArray(data.history) ? (data.history as RequestHistoryEntry[]) : [],
  };
}

// Lightweight guest-side email ownership check used at Step 2 — proves
// the typed Contact Email is real and belongs to whoever's submitting,
// without creating a session or unlocking history/profile the way the
// full "I've submitted before" verifyOtp flow does.
export async function verifyEmailOwnership(
  email: string,
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await postAction({ action: "verifyEmailOnly", email, code });
  if (!result.ok) return result;
  return { ok: true };
}

// Exact text Code.gs's getHistoryAction_/getRequestDetailAction_ return
// when the session cache entry (60 min TTL) is gone — a real, actionable
// message the backend already provides, distinct from a generic failure.
export const SESSION_EXPIRED_ERROR =
  "Your session has expired. Please verify your email again.";

export function isSessionExpiredError(error: string): boolean {
  return error === SESSION_EXPIRED_ERROR;
}

export async function getHistory(
  email: string,
  sessionToken: string,
): Promise<{ ok: true; history: RequestHistoryEntry[] } | { ok: false; error: string }> {
  const result = await postAction({ action: "getHistory", email, sessionToken });
  if (!result.ok) return result;

  const { data } = result;
  return {
    ok: true,
    history: Array.isArray(data.history) ? (data.history as RequestHistoryEntry[]) : [],
  };
}

export async function getRequestDetail(
  email: string,
  sessionToken: string,
  requestId: string,
): Promise<{ ok: true; detail: RequestDetail } | { ok: false; error: string }> {
  const result = await postAction({
    action: "getRequestDetail",
    email,
    sessionToken,
    requestId,
  });
  if (!result.ok) return result;

  return { ok: true, detail: result.data.detail as RequestDetail };
}
