import { useEffect, useRef } from "react";

/**
 * Ensures a repeatable field array starts with exactly one entry, guarded
 * against React StrictMode's dev-only double effect invocation (both
 * invocations would otherwise see the same stale empty `fields` array before
 * the first append is reflected into a render, appending twice).
 */
export function useEnsureOneEntry<T>(
  fields: T[],
  append: (value: T) => void,
  createBlank: () => T,
) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current && fields.length === 0) {
      initialized.current = true;
      append(createBlank());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
