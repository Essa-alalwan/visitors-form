import type { SubmissionPayload, SubmitResult } from "./payloadTypes";
import { toWirePayload } from "./wirePayload";

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

export async function submitRequest(
  payload: SubmissionPayload,
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

  let response: Response;
  try {
    response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: {
        // Intentionally text/plain, NOT application/json — this avoids a
        // CORS preflight request that Apps Script Web Apps handle poorly.
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(wirePayload),
    });
  } catch {
    return {
      success: false,
      error: "Couldn't reach the server. Check your internet connection and try again.",
    };
  }

  if (!response.ok) {
    return {
      success: false,
      error: `The server returned an unexpected error (HTTP ${response.status}). Please try again later.`,
    };
  }

  let result: unknown;
  try {
    result = await response.json();
  } catch {
    return {
      success: false,
      error: "The server sent back an unreadable response. Please try again later.",
    };
  }

  const parsed = parseSubmitResult(result);
  if (!parsed) {
    return {
      success: false,
      error: "The server returned an unexpected response. Please try again later.",
    };
  }

  return parsed;
}
