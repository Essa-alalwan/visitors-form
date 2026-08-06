import { AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { FieldError } from "../feedback/FieldError";

export function RepeatableSection<T extends { id: string }>({
  title,
  items,
  addLabel,
  onAdd,
  emptyMessage,
  error,
  renderItem,
}: {
  title?: string;
  items: T[];
  addLabel: string;
  onAdd: () => void;
  emptyMessage: string;
  error?: string;
  renderItem: (item: T, index: number) => ReactNode;
}) {
  return (
    <div>
      {title && (
        <h3 className="mb-3 text-sm font-semibold text-slate-800">{title}</h3>
      )}

      <button
        type="button"
        onClick={onAdd}
        className="mb-4 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-primary-300 py-3 text-sm font-semibold text-primary-700 transition-colors hover:border-primary-500 hover:bg-primary-50"
      >
        <Plus className="h-4 w-4" />
        {addLabel}
      </button>

      {items.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          {emptyMessage}
        </p>
      )}

      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {items.map((item, index) => (
            <div key={item.id}>{renderItem(item, index)}</div>
          ))}
        </AnimatePresence>
      </div>

      <FieldError message={error} />
    </div>
  );
}
