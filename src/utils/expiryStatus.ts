const EXPIRING_SOON_DAYS = 60;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type ExpiryTier = "in-date" | "expiring" | "expired";

export interface ExpiryStatus {
  tier: ExpiryTier;
  label: string;
}

function toDate(value: Date | string | undefined): Date | undefined {
  if (!value) return undefined;
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

/**
 * Single source of truth for the green/amber/red expiry thresholds,
 * shared by every expiry-dated field in the app (visitor CPR/passport,
 * equipment CPR, visitor/equipment attachment expiry) plus the
 * returning-user banner, so they can never disagree with each other.
 */
export function getExpiryStatus(
  value: Date | string | undefined,
): ExpiryStatus | null {
  const date = toDate(value);
  if (!date) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const daysUntil = Math.round((target.getTime() - today.getTime()) / MS_PER_DAY);

  if (daysUntil < 0) {
    return { tier: "expired", label: "Expired" };
  }
  if (daysUntil <= EXPIRING_SOON_DAYS) {
    return { tier: "expiring", label: "About to Expire" };
  }
  return { tier: "in-date", label: "In Date" };
}

export function expiryBadgeClasses(tier: ExpiryTier): string {
  if (tier === "expired") return "bg-red-50 text-red-700 ring-red-200";
  if (tier === "expiring") return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-green-50 text-green-700 ring-green-200";
}
