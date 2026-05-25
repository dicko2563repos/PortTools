/** ASIC expiry month semantics — cards valid through the last day of the expiry month (UTC). */

export function lastDayOfAsicExpiryMonth(expiryDate: Date): Date {
  const year = expiryDate.getUTCFullYear();
  const month = expiryDate.getUTCMonth();
  return new Date(Date.UTC(year, month + 1, 0, 12, 0, 0, 0));
}

export function formatAsicExpiryMonth(date: Date): string {
  const month = date.getUTCMonth() + 1;
  const year = date.getUTCFullYear() % 100;
  return `${String(month).padStart(2, "0")}/${String(year).padStart(2, "0")}`;
}

export function daysUntilAsicExpiry(expiryDate: Date, today: Date = new Date()): number {
  const day = new Date(today);
  day.setUTCHours(12, 0, 0, 0);
  const exp = lastDayOfAsicExpiryMonth(expiryDate);
  return Math.ceil((exp.getTime() - day.getTime()) / 86400000);
}
