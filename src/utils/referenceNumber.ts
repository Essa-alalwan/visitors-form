export function generateReferenceNumber(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `AII-${y}${m}${d}-${random}`;
}
