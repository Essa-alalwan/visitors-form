import { motion } from "framer-motion";
import { Trash2, Pencil, ChevronDown, AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

export function RepeatableCard({
  title,
  onRemove,
  removeLabel,
  children,
  collapsed = false,
  onToggle,
  summary,
  hasError = false,
  statusBadge,
}: {
  title: string;
  onRemove?: () => void;
  removeLabel: string;
  children: ReactNode;
  /** When true, renders a compact summary row instead of `children`. */
  collapsed?: boolean;
  /** Expands/collapses this card. Omit to always render fully expanded
   * (e.g. accordion behavior isn't relevant for this list). */
  onToggle?: () => void;
  /** Shown in the compact row while collapsed. */
  summary?: ReactNode;
  /** Shows a warning icon on the collapsed row when something inside this
   * item is still invalid, so it can't silently hide behind the summary. */
  hasError?: boolean;
  /** e.g. an expiry-status pill — rendered next to (not inside) the
   * truncating summary text so it never gets clipped. */
  statusBadge?: ReactNode;
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
      <div
        className={`flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 ${
          onToggle ? "cursor-pointer" : ""
        }`}
        onClick={onToggle}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
            {hasError && (
              <AlertTriangle
                className="h-3.5 w-3.5 flex-shrink-0 text-amber-500"
                aria-label="This item has a validation error"
              />
            )}
          </div>
          {collapsed && (summary || statusBadge) && (
            <div className="mt-0.5 flex items-center gap-2">
              {summary && (
                <p className="truncate text-xs text-slate-500">{summary}</p>
              )}
              {statusBadge}
            </div>
          )}
        </div>

        <div className="flex flex-shrink-0 items-center gap-1">
          {onToggle && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-50"
            >
              {collapsed ? (
                <>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </>
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {collapsed ? "" : removeLabel}
            </button>
          )}
        </div>
      </div>
      {!collapsed && <div className="space-y-4 p-4">{children}</div>}
    </motion.div>
  );
}
