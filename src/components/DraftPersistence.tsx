import { useEffect, useRef } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useFormWizard } from "../context/FormWizardContext";
import { useProfile } from "../context/ProfileContext";
import { saveDraft, loadDraft, clearDraft, type PersistedDraft } from "../utils/draftStorage";
import type { FormValues } from "../schemas/formSchema";

// Marks "this tab already has a draft in flight" — sessionStorage is
// cleared by the browser when the tab closes but survives a refresh of
// the same tab, which is exactly the lifetime we want: refreshing keeps
// the draft, closing the tab (even if a new one is opened right after)
// starts blank. The actual draft payload lives in IndexedDB (see
// draftStorage.ts); this is only the gate deciding whether to read it.
const SESSION_MARKER = "visitors-form-draft-active";
const SAVE_DEBOUNCE_MS = 500;

/** Mounted once near the root, inside FormProvider + FormWizardProvider +
 * ProfileProvider. Restores an in-progress submission after a same-tab
 * refresh (form values, wizard step, and verified-session state), wipes
 * any leftover draft when a genuinely new tab starts, and thereafter
 * keeps saving changes to IndexedDB on a short debounce. Renders nothing. */
export function DraftPersistence() {
  const { reset, control } = useFormContext<FormValues>();
  const { step, maxStepReached, referenceNumber, goToStep, setReferenceNumber } =
    useFormWizard();
  const { entryChoice, email, sessionToken, profile, history, restoreSession } =
    useProfile();

  const formValues = useWatch({ control });
  const restoreDoneRef = useRef(false);
  const saveTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const isSameTabRefresh = sessionStorage.getItem(SESSION_MARKER) === "1";

      if (!isSameTabRefresh) {
        sessionStorage.setItem(SESSION_MARKER, "1");
        await clearDraft();
        if (!cancelled) restoreDoneRef.current = true;
        return;
      }

      const draft = await loadDraft();
      if (cancelled) return;

      if (draft) {
        reset(draft.formValues);

        if (draft.wizard) {
          // goToStep bumps maxStepReached to at least its target, so
          // going to the saved maxStepReached first then back down to
          // the saved current step reconstructs both without needing a
          // dedicated setter for maxStepReached.
          goToStep(draft.wizard.maxStepReached);
          goToStep(draft.wizard.step);
          setReferenceNumber(draft.wizard.referenceNumber);
        }

        if (draft.profileSession) {
          restoreSession(draft.profileSession);
        }
      }

      restoreDoneRef.current = true;
    })();

    return () => {
      cancelled = true;
    };
    // Restore is a one-time, mount-only pass.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Skip saving until the restore pass above has finished — otherwise
    // this would race the async IndexedDB read and overwrite a real
    // draft with a blank snapshot before it's ever read back.
    if (!restoreDoneRef.current) return;

    window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      const draft: PersistedDraft = {
        formValues: formValues as FormValues,
        wizard: { step, maxStepReached, referenceNumber },
        profileSession:
          entryChoice === null
            ? null
            : { entryChoice, email, sessionToken, profile, history },
      };
      saveDraft(draft);
    }, SAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(saveTimerRef.current);
  }, [
    formValues,
    step,
    maxStepReached,
    referenceNumber,
    entryChoice,
    email,
    sessionToken,
    profile,
    history,
  ]);

  return null;
}
