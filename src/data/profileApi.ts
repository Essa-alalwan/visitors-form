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
  visitDateTime?: string;
  status?: string;
  submittedAt?: string;
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

async function postAction(body: Record<string, unknown>): Promise<
  { ok: true; data: Record<string, unknown> } | { ok: false; error: string }
> {
  if (!APPS_SCRIPT_URL) {
    return {
      ok: false,
      error: "The form isn't configured with a backend URL. Contact the site administrator.",
    };
  }

  let response: Response;
  try {
    response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, error: "Couldn't reach the server. Check your internet connection and try again." };
  }

  if (!response.ok) {
    return { ok: false, error: GENERIC_ERROR };
  }

  let result: unknown;
  try {
    result = await response.json();
  } catch {
    return { ok: false, error: GENERIC_ERROR };
  }

  if (typeof result !== "object" || result === null) {
    return { ok: false, error: GENERIC_ERROR };
  }

  const data = result as Record<string, unknown>;
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
