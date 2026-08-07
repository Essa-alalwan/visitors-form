import { motion } from "framer-motion";
import { CheckCircle2, Pencil, RotateCcw } from "lucide-react";

export function SuccessScreen({
  referenceNumber,
  contactEmail,
  onEdit,
  onReset,
}: {
  referenceNumber: string;
  contactEmail?: string;
  onEdit: () => void;
  onReset: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10"
    >
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 14 }}
        className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent-100 text-accent-600"
      >
        <CheckCircle2 className="h-9 w-9" />
      </motion.span>

      <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
        Request Submitted
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        Your access request has been received and is pending review.
      </p>

      <div className="mx-auto mt-5 inline-flex flex-col items-center rounded-xl bg-primary-50 px-6 py-3">
        <span className="text-xs font-medium uppercase tracking-wide text-primary-500">
          Reference Number
        </span>
        <span className="text-lg font-bold tracking-wide text-primary-700">
          {referenceNumber}
        </span>
      </div>

      <p className="mx-auto mt-5 max-w-sm text-sm text-slate-500">
        {contactEmail
          ? `Status updates will be sent to ${contactEmail}.`
          : "Status updates will be sent to the contact email if one was provided."}
      </p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
        >
          <Pencil className="h-4 w-4" />
          Edit This Request
        </button>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 rounded-xl bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-accent-500/30 transition-colors hover:bg-accent-600"
        >
          <RotateCcw className="h-4 w-4" />
          Submit Another Request
        </button>
      </div>
    </motion.div>
  );
}
