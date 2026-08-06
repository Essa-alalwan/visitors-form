import { AnimatePresence, motion } from "framer-motion";

export function FieldError({ message }: { message?: string }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.p
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: "auto", marginTop: 6 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          className="text-sm text-red-600"
          role="alert"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
