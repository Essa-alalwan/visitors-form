import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";

export function RepeatableCard({
  title,
  onRemove,
  removeLabel,
  children,
}: {
  title: string;
  onRemove?: () => void;
  removeLabel: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60"
    >
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {removeLabel}
          </button>
        )}
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </motion.div>
  );
}
