// Persists an in-progress submission (form values, wizard position, and
// verified-session state) across a page refresh, so a reload doesn't throw
// away everything the person already filled in. Uses IndexedDB rather than
// localStorage specifically because IndexedDB's structured-clone storage
// keeps File/Blob/Date objects as real, usable instances on the way back
// out — no manual base64/ISO-string conversion needed — and its quota is
// far larger than localStorage's ~5-10MB text-only limit, which matters
// once attached PDFs/photos are part of what's being saved.
//
// Deliberately a single fixed-key slot, not a per-session store: this is a
// single-purpose, one-request-at-a-time form, not a multi-draft app.

import type { FormValues } from "../schemas/formSchema";
import type {
  RequesterProfileData,
  RequestHistoryEntry,
} from "../data/profileApi";
import type { EntryChoice } from "../context/ProfileContext";

const DB_NAME = "visitors-form-draft";
const DB_VERSION = 1;
const STORE_NAME = "draft";
const DRAFT_KEY = "current";

export interface PersistedDraft {
  formValues: FormValues;
  wizard: {
    step: number;
    maxStepReached: number;
    referenceNumber: string | null;
  };
  profileSession: {
    entryChoice: EntryChoice;
    email: string | null;
    sessionToken: string | null;
    profile: RequesterProfileData | null;
    history: RequestHistoryEntry[];
  } | null;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Storage failures (quota exceeded, private-mode restrictions, IndexedDB
// unavailable) must never break the actual form — persistence is a
// nice-to-have layered on top, not a requirement to use the app.
async function withStoreSilently<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T | undefined> {
  try {
    const db = await openDb();
    return await new Promise<T | undefined>((resolve) => {
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);
      const request = action(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(undefined);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return undefined;
  }
}

export async function saveDraft(draft: PersistedDraft): Promise<void> {
  await withStoreSilently("readwrite", (store) => store.put(draft, DRAFT_KEY));
}

export async function loadDraft(): Promise<PersistedDraft | undefined> {
  return withStoreSilently("readonly", (store) => store.get(DRAFT_KEY));
}

export async function clearDraft(): Promise<void> {
  await withStoreSilently("readwrite", (store) => store.delete(DRAFT_KEY));
}
