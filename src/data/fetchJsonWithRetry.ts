/**
 * Google Apps Script web apps deliver responses through an internal
 * `exec` -> `echo?user_content_key=...` hop that intermittently fails —
 * serving a Drive "unable to open the file" HTML page instead of the
 * real JSON response, even though the script itself already ran
 * successfully (confirmed via the Executions log completing cleanly and,
 * in one case, an OTP email actually arriving despite the frontend
 * showing an error). This is outside our code and can't be fixed at the
 * source, so this helper retries transparently to give it another
 * chance to get through.
 *
 * Only retries on symptoms of that delivery failure (network error,
 * timeout, non-OK status, unparsable body) — never on a validly parsed
 * JSON response, even an `{ok: false, ...}` one, since that's a real
 * application answer (wrong OTP, validation error, etc.) that must
 * surface immediately rather than being retried.
 */

const MAX_ATTEMPTS = 3;
const ATTEMPT_TIMEOUT_MS = 20000;
const RETRY_DELAY_MS = 600;

export type FetchJsonResult =
  | { ok: true; data: unknown }
  | {
      ok: false;
      reason: "network" | "timeout" | "bad-status" | "bad-json";
      status?: number;
    };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchJsonWithRetry(
  url: string,
  body: unknown,
): Promise<FetchJsonResult> {
  let lastFailure: FetchJsonResult = { ok: false, reason: "network" };

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: "POST",
        // Intentionally text/plain, NOT application/json — this avoids a
        // CORS preflight request that Apps Script Web Apps handle poorly.
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        lastFailure = { ok: false, reason: "bad-status", status: response.status };
      } else {
        try {
          const data = await response.json();
          return { ok: true, data };
        } catch {
          lastFailure = { ok: false, reason: "bad-json" };
        }
      }
    } catch (err) {
      lastFailure = {
        ok: false,
        reason: (err as { name?: string })?.name === "AbortError" ? "timeout" : "network",
      };
    } finally {
      clearTimeout(timer);
    }

    if (attempt < MAX_ATTEMPTS) {
      await sleep(RETRY_DELAY_MS);
    }
  }

  return lastFailure;
}
