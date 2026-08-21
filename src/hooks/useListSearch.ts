import { useState } from "react";
import { useWatch, type Control } from "react-hook-form";

/** Filters a react-hook-form field array by matching text against a set of
 * sub-fields, without ever reordering or slicing the underlying array —
 * `matches(index)` is keyed by the array's true index, since callers rely
 * on that index staying correct for field names (`visitors.${index}.name`)
 * and `remove(index)`. Callers render `null` for non-matching indices
 * instead of filtering what they hand to the list, which is what keeps
 * those indices valid. */
export function useListSearch<T extends Record<string, unknown>>(
  control: Control,
  name: string,
  matchFields: (keyof T)[],
) {
  const [query, setQuery] = useState("");
  const items = useWatch({ control, name }) as T[] | undefined;
  const q = query.trim().toLowerCase();

  function matches(index: number): boolean {
    if (!q) return true;
    const item = items?.[index];
    if (!item) return true;
    return matchFields.some((field) =>
      String(item[field] ?? "")
        .toLowerCase()
        .includes(q),
    );
  }

  return { query, setQuery, matches, hasQuery: q.length > 0 };
}
