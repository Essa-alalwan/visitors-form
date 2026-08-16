import { nanoid } from "nanoid";
import type { SubmissionPayload, SubmitResult } from "./payloadTypes";
import { toWirePayload } from "./wirePayload";
import { fetchJsonWithRetry } from "./fetchJsonWithRetry";

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

/**
 * The backend's own validation messages (e.g. "X is required.") are written
 * in English by hand and are meant to be shown to the user as-is. But some
 * failures are native Google API/runtime exceptions (e.g. a Drive lookup
 * failing) whose message text is localized by Google based on the Apps
 * Script project/account's language setting — we've seen these come back in
 * Arabic. There's no way to request an English version of those from the
 * frontend, so any error that isn't recognizably English is swapped for a
 * generic English message here (the original is still logged to the
 * console for debugging).
 */
function isLikelyEnglish(text: string): boolean {
  const letters = text.match(/[A-Za-z]/g)?.length ?? 0;
  const nonAsciiLetters = text.match(/[^\x00-\x7F]/g)?.length ?? 0;
  return letters > 0 && nonAsciiLetters === 0;
}

/**
 * The real backend's raw response is asymmetric: a successful write looks
 * like {ok:true, requestId, version}, while a rejected/errored request looks
 * like {success:false, error} — confirmed against the live endpoint. This
 * normalizes both into the app's consistent SubmitResult shape.
 */
function parseSubmitResult(value: unknown): SubmitResult | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;

  if (v.ok === true && typeof v.requestId === "string") {
    return {
      success: true,
      requestId: v.requestId,
      version: typeof v.version === "string" ? v.version : undefined,
    };
  }
  if (v.success === false && typeof v.error === "string") {
    if (!isLikelyEnglish(v.error)) {
      // eslint-disable-next-line no-console
      console.error("[submitRequest] Non-English backend error:", v.error);
      return {
        success: false,
        error: "Something went wrong on the server. Please try again or contact support.",
      };
    }
    return { success: false, error: v.error };
  }
  return null;
}

export interface SubmitRequestOptions {
  saveProfile?: boolean;
  accountEmail?: string;
  sessionToken?: string;
}

export async function submitRequest(
  payload: SubmissionPayload,
  options?: SubmitRequestOptions,
): Promise<SubmitResult> {
  if (!APPS_SCRIPT_URL) {
    return {
      success: false,
      error:
        "The form isn't configured with a backend URL. Contact the site administrator.",
    };
  }

  let wirePayload;
  try {
    wirePayload = await toWirePayload(payload);
  } catch {
    return {
      success: false,
      error: "Couldn't read one of the attached files. Please re-attach it and try again.",
    };
  }

  const body = {
    action: "submitRequest",
    ...wirePayload,
    saveProfile: options?.saveProfile || undefined,
    accountEmail: options?.accountEmail || undefined,
    sessionToken: options?.sessionToken || undefined,
    // Stays identical across every retry attempt of this one call (the
    // same `body` object is re-sent each time), letting the backend
    // recognize a retried submission and return the original result
    // instead of writing a duplicate request row.
    idempotencyKey: nanoid(),
  };

  const result = await fetchJsonWithRetry(APPS_SCRIPT_URL, body);
  if (!result.ok) {
    return {
      success: false,
      error: result.reason === "network"
        ? "Couldn't reach the server. Check your internet connection and try again."
        : "We didn't get a clear response back after a few tries. Your request may have already been submitted — check \"My Requests\" before submitting again.",
    };
  }

  const parsed = parseSubmitResult(result.data);
  if (!parsed) {
    return {
      success: false,
      error: "The server returned an unexpected response. Please try again later.",
    };
  }

  return parsed;
}
