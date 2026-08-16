import { getExpiryStatus, expiryBadgeClasses } from "../../utils/expiryStatus";

export function ExpiryBadge({ date }: { date: Date | string | undefined }) {
  const status = getExpiryStatus(date);
  if (!status) return null;

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${expiryBadgeClasses(status.tier)}`}
    >
      {status.label}
    </span>
  );
}
