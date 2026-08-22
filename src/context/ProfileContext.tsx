import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  requestOtp,
  verifyOtp,
  getHistory,
  isSessionExpiredError,
  type RequesterProfileData,
  type RequestHistoryEntry,
} from "../data/profileApi";

export type EntryChoice = "guest" | "returning" | null;

interface ProfileContextValue {
  entryChoice: EntryChoice;
  chooseGuest: () => void;
  chooseReturning: () => void;
  backToEntry: () => void;

  email: string | null;
  sessionToken: string | null;
  profile: RequesterProfileData | null;
  history: RequestHistoryEntry[];
  isVerified: boolean;

  otpStage: "email" | "code";
  otpSending: boolean;
  otpError: string | null;
  sendCode: (email: string) => Promise<boolean>;
  confirmCode: (code: string) => Promise<boolean>;
  resendCode: () => Promise<boolean>;

  refreshHistory: () => Promise<void>;
  signOut: () => void;
  // Reapplies already-verified state restored from a persisted draft
  // (see DraftPersistence.tsx) after a page refresh — deliberately does
  // NOT go through requestOtp/verifyOtp, since this isn't a new login,
  // just reinstating a session that was already proven valid earlier in
  // the same tab.
  restoreSession: (data: {
    entryChoice: EntryChoice;
    email: string | null;
    sessionToken: string | null;
    profile: RequesterProfileData | null;
    history: RequestHistoryEntry[];
  }) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [entryChoice, setEntryChoice] = useState<EntryChoice>(null);

  const [email, setEmail] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<RequesterProfileData | null>(null);
  const [history, setHistory] = useState<RequestHistoryEntry[]>([]);

  const [otpStage, setOtpStage] = useState<"email" | "code">("email");
  const [otpSending, setOtpSending] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  async function sendCode(candidateEmail: string) {
    setOtpSending(true);
    setOtpError(null);
    const result = await requestOtp(candidateEmail);
    setOtpSending(false);

    if (!result.ok) {
      setOtpError(result.error);
      return false;
    }

    setPendingEmail(candidateEmail);
    setOtpStage("code");
    return true;
  }

  async function confirmCode(code: string) {
    if (!pendingEmail) {
      setOtpError("Please enter your email again.");
      setOtpStage("email");
      return false;
    }

    setOtpSending(true);
    setOtpError(null);
    const result = await verifyOtp(pendingEmail, code);
    setOtpSending(false);

    if (!result.ok) {
      setOtpError(result.error);
      return false;
    }

    setEmail(pendingEmail);
    setSessionToken(result.sessionToken);
    setProfile(result.profile);
    setHistory(result.history);
    return true;
  }

  async function resendCode() {
    if (!pendingEmail) return false;
    return sendCode(pendingEmail);
  }

  async function refreshHistory() {
    if (!email || !sessionToken) return;
    const result = await getHistory(email, sessionToken);
    if (result.ok) {
      setHistory(result.history);
    } else if (isSessionExpiredError(result.error)) {
      // The 60-minute session cache entry is gone server-side — nothing to
      // retry here, so drop back to the entry-choice screen instead of
      // silently doing nothing (the previous behavior) or leaving stale
      // history displayed.
      signOut();
    }
  }

  function signOut() {
    setEmail(null);
    setSessionToken(null);
    setProfile(null);
    setHistory([]);
    setPendingEmail(null);
    setOtpStage("email");
    setOtpError(null);
    setEntryChoice(null);
  }

  function restoreSession(data: {
    entryChoice: EntryChoice;
    email: string | null;
    sessionToken: string | null;
    profile: RequesterProfileData | null;
    history: RequestHistoryEntry[];
  }) {
    setEntryChoice(data.entryChoice);
    setEmail(data.email);
    setSessionToken(data.sessionToken);
    setProfile(data.profile);
    setHistory(data.history);
  }

  const value = useMemo<ProfileContextValue>(
    () => ({
      entryChoice,
      chooseGuest: () => setEntryChoice("guest"),
      chooseReturning: () => setEntryChoice("returning"),
      backToEntry: () => {
        setEntryChoice(null);
        setOtpStage("email");
        setOtpError(null);
      },
      email,
      sessionToken,
      profile,
      history,
      isVerified: Boolean(email && sessionToken),
      otpStage,
      otpSending,
      otpError,
      sendCode,
      confirmCode,
      resendCode,
      refreshHistory,
      signOut,
      restoreSession,
    }),
    [entryChoice, email, sessionToken, profile, history, otpStage, otpSending, otpError],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return ctx;
}
