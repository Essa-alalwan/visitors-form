import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export function LoadingOverlay({ label = "Submitting your request..." }: { label?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/85 backdrop-blur-sm"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      <p className="text-sm font-medium text-slate-600">{label}</p>
    </motion.div>
  );
}
