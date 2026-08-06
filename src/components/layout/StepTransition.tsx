import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

export function StepTransition({
  stepKey,
  direction,
  children,
}: {
  stepKey: number;
  direction: 1 | -1;
  children: ReactNode;
}) {
  return (
    <AnimatePresence mode="wait" custom={direction} initial={false}>
      <motion.div
        key={stepKey}
        custom={direction}
        initial={{ opacity: 0, x: direction * 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: direction * -24 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
