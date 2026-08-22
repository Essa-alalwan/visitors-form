import { useEffect, useRef, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { requestOtp, verifyEmailOwnership } from "../../data/profileApi";

const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Lightweight guest-side email verification, shown at Step 2 before a
 * guest can continue. Proves they own the Contact Email they typed — a
 * one-time code, nothing more. Deliberately doesn't use ProfileContext:
 * this never creates a session or unlocks history/profile, unlike the
 * full "I've submitted before" OTP flow.
 */
export function VerifyEmailModal({
  email,
  open,
  onVerified,
  onCancel,
}: {
  email: string;
  open: boolean;
  onVerified: () => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  // Synchronous guard against React StrictMode's dev-only double-effect
  // invocation — a `useState` guard isn't enough here, since both
  // invocations can see the old state before either update lands,
  // firing two separate OTP sends (each capable of caching a different
  // code server-side). A ref updates immediately, so the second
  // invocation correctly sees it's already been claimed and skips.
  const sendStartedRef = useRef(false);

  // Reset everything each time the modal is (re)opened for a fresh email
  // (e.g. the guest went back and changed it) so nothing carries over.
  useEffect(() => {
    if (!open) return;
    setCode("");
    setError(null);
    setCooldown(RESEND_COOLDOWN_SECONDS);
    sendStartedRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, email]);

  useEffect(() => {
    if (!open || sendStartedRef.current) return;
    sendStartedRef.current = true;

    let cancelled = false;

    async function sendInitial() {
      setSending(true);
      setError(null);
      const result = await requestOtp(email);
      if (cancelled) return;
      setSending(false);
      if (!result.ok) setError(result.error);
    }

    sendInitial();
    return () => {
      cancelled = true;
    };
  }, [open, email]);

  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [open]);

  async function handleResend() {
    setSending(true);
    setError(null);
    const result = await requestOtp(email);
    setSending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCooldown(RESEND_COOLDOWN_SECONDS);
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setSending(true);
    setError(null);
    const result = await verifyEmailOwnership(email, code.trim());
    setSending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onVerified();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            Verify your email
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-4 text-sm text-slate-500">
          We've sent a 6-digit code to{" "}
          <span className="font-medium text-slate-700">{email}</span>. Enter
          it below to continue.
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-center text-lg tracking-[0.3em] text-slate-900 placeholder:tracking-normal placeholder:text-slate-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
          />

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleResend}
            disabled={sending || cooldown > 0}
            className="text-sm font-medium text-primary-700 hover:text-primary-800 disabled:opacity-60"
          >
            {cooldown > 0
              ? `Didn't get it? Resend in ${cooldown}s`
              : "Didn't get it? Send a new code"}
          </button>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="rounded-xl bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-accent-500/30 transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {sending ? "Verifying..." : "Verify & Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
