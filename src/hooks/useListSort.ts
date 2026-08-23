import { useState } from "react";
import { useWatch, type Control } from "react-hook-form";
import { worstExpiryStatus } from "../utils/expiryStatus";

export const SORT_OPTIONS = ["Original order", "Expiry status", "Name (A-Z)"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

const TIER_PRIORITY: Record<string, number> = { expired: 2, expiring: 1, "in-date": 0 };

/** Sorts a react-hook-form field array for display without ever reordering
 * the underlying array — `sortedIndexes` is the display order expressed as
 * true array positions (e.g. `[2, 0, 1]`), so every consumer keeps using
 * real indices for field names, `remove(index)`, etc. Mirrors
 * `useListSearch`'s "never touch the real array" approach for the same
 * reason: `useFieldArray`'s indices have to stay correct. */
export function useListSort<T extends Record<string, unknown>>(
  control: Control,
  name: string,
  config: {
    getName?: (item: T) => string | undefined;
    getExpiryDates?: (item: T) => (Date | string | undefined)[];
  },
) {
  const availableOptions: SortOption[] = ["Original order"];
  if (config.getExpiryDates) availableOptions.push("Expiry status");
  if (config.getName) availableOptions.push("Name (A-Z)");

  const [sortBy, setSortBy] = useState<SortOption>("Original order");
  const items = (useWatch({ control, name }) as T[] | undefined) ?? [];

  const sortedIndexes = items.map((_item, i) => i);

  if (sortBy === "Expiry status" && config.getExpiryDates) {
    const getExpiryDates = config.getExpiryDates;
    sortedIndexes.sort((a, b) => {
      const statusA = worstExpiryStatus(getExpiryDates(items[a]));
      const statusB = worstExpiryStatus(getExpiryDates(items[b]));
      const priorityA = statusA ? TIER_PRIORITY[statusA.tier] : -1;
      const priorityB = statusB ? TIER_PRIORITY[statusB.tier] : -1;
      return priorityB - priorityA; // worst (expired) first
    });
  } else if (sortBy === "Name (A-Z)" && config.getName) {
    const getName = config.getName;
    sortedIndexes.sort((a, b) =>
      (getName(items[a]) || "").localeCompare(getName(items[b]) || ""),
    );
  }

  return { sortBy, setSortBy, sortedIndexes, availableOptions };
}
