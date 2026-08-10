import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Inbox, PencilLine, Copy, Loader2 } from "lucide-react";
import { useProfile } from "../../context/ProfileContext";

export function HistoryModal({
  open,
  onClose,
  onEditRequest,
  onDuplicateRequest,
}: {
  open: boolean;
  onClose: () => void;
  onEditRequest: (requestId: string) => Promise<boolean>;
  onDuplicateRequest: (requestId: string) => Promise<boolean>;
}) {
  const { history, refreshHistory } = useProfile();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (open) refreshHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleOpen(requestId: string, action: (id: string) => Promise<boolean>) {
    setLoadingId(requestId);
    setLoadError(null);
    const ok = await action(requestId);
    setLoadingId(null);
    if (!ok) {
      setLoadError("Couldn't load that request. Please try again.");
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">
                My Requests
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-4">
              {loadError && (
                <p className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {loadError}
                </p>
              )}

              {history.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-slate-500">
                  <Inbox className="h-6 w-6 text-slate-300" />
                  No past requests found for this email yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((item) => (
                    <div
                      key={item.requestId}
                      className="rounded-xl border border-slate-200 bg-slate-50/60 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-800">
                          {item.requestId}
                        </span>
                        {item.status && (
                          <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                            {item.status}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.requestType}
                        {item.visitDateTime ? ` · ${item.visitDateTime}` : ""}
                      </p>
                      <div className="mt-2 flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => handleOpen(item.requestId, onEditRequest)}
                          disabled={loadingId !== null}
                          className="flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:text-primary-800 disabled:opacity-60"
                        >
                          {loadingId === item.requestId ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <PencilLine className="h-3.5 w-3.5" />
                          )}
                          Edit This Request
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpen(item.requestId, onDuplicateRequest)}
                          disabled={loadingId !== null}
                          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 disabled:opacity-60"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Resubmit as New
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
