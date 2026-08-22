import { useEffect, useState, type FormEvent } from "react";
import { UserRound, History, ArrowLeft } from "lucide-react";
import { StepCard } from "../layout/StepCard";
import { useProfile } from "../../context/ProfileContext";

// Matches the backend's own resend cooldown (requestOtp_'s 60-second
// throttle) — this is purely a UI countdown so people can see when
// they're allowed to resend instead of guessing and hitting the
// backend's "please wait" error.
const RESEND_COOLDOWN_SECONDS = 60;

function EmailStep() {
  const { sendCode, otpSending, otpError, backToEntry } = useProfile();
  const [email, setEmail] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    await sendCode(email.trim());
  }

  return (
    <StepCard
      title="Welcome back"
      description="Enter the email you used before — we'll send you a one-time code."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="returning-email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="returning-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
          />
        </div>

        {otpError && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{otpError}</p>
        )}

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={backToEntry}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button
            type="submit"
            disabled={otpSending}
            className="rounded-xl bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-accent-500/30 transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {otpSending ? "Sending code..." : "Send me a code"}
          </button>
        </div>
      </form>
    </StepCard>
  );
}

function CodeStep() {
  const { confirmCode, resendCode, otpSending, otpError, backToEntry } = useProfile();
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    const timer = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    await confirmCode(code.trim());
  }

  async function handleResend() {
    const ok = await resendCode();
    if (ok) setCooldown(RESEND_COOLDOWN_SECONDS);
  }

  return (
    <StepCard
      title="Enter your code"
      description="We've emailed you a 6-digit code. It expires in a few minutes."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="otp-code" className="mb-1.5 block text-sm font-medium text-slate-700">
            6-digit code
          </label>
          <input
            id="otp-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-center text-lg tracking-[0.3em] text-slate-900 placeholder:tracking-normal placeholder:text-slate-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
          />
        </div>

        {otpError && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{otpError}</p>
        )}

        <button
          type="button"
          onClick={handleResend}
          disabled={otpSending || cooldown > 0}
          className="text-sm font-medium text-primary-700 hover:text-primary-800 disabled:opacity-60"
        >
          {cooldown > 0
            ? `Didn't get it? Resend in ${cooldown}s`
            : "Didn't get it? Send a new code"}
        </button>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={backToEntry}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button
            type="submit"
            disabled={otpSending}
            className="rounded-xl bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-accent-500/30 transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {otpSending ? "Verifying..." : "Verify & Continue"}
          </button>
        </div>
      </form>
    </StepCard>
  );
}

function ChoiceStep() {
  const { chooseGuest, chooseReturning } = useProfile();

  return (
    <StepCard
      title="Aldur II IWPP Access Portal"
      description="Choose how you'd like to continue."
    >
      <button
        type="button"
        onClick={chooseGuest}
        className="flex w-full items-center gap-3 rounded-xl border-2 border-primary-500 bg-primary-50 px-5 py-4 text-left transition-colors hover:bg-primary-100"
      >
        <UserRound className="h-5 w-5 flex-shrink-0 text-primary-700" />
        <span>
          <span className="block text-sm font-semibold text-slate-900">
            Continue as Guest
          </span>
          <span className="block text-xs text-slate-500">
            Fill out a new request — no email or sign-in needed.
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={chooseReturning}
        className="flex w-full items-center gap-3 rounded-xl border border-dashed border-slate-300 px-5 py-4 text-left transition-colors hover:border-primary-400 hover:bg-slate-50"
      >
        <History className="h-5 w-5 flex-shrink-0 text-slate-500" />
        <span>
          <span className="block text-sm font-semibold text-slate-800">
            Sign In
          </span>
          <span className="block text-xs text-slate-500">
            Verify your email to prefill your info and see your past requests.
          </span>
        </span>
      </button>
    </StepCard>
  );
}

export function EntryGate() {
  const { entryChoice, otpStage } = useProfile();

  if (entryChoice === "returning") {
    return otpStage === "email" ? <EmailStep /> : <CodeStep />;
  }

  return <ChoiceStep />;
}
