/** ASIC cards show expiry as MM/YY; DB stores the 1st of that month (UTC). */

export function parseAsicExpiryMonth(raw: string): Date | null {
  const s = raw.trim();

  let match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (month < 1 || month > 12) return null;
    return monthStartUtc(year, month);
  }

  match = /^(\d{4})-(\d{2})$/.exec(s);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (month < 1 || month > 12) return null;
    return monthStartUtc(year, month);
  }

  match = /^(\d{1,2})\/(\d{2})$/.exec(s);
  if (match) {
    const month = Number(match[1]);
    const yy = Number(match[2]);
    if (month < 1 || month > 12) return null;
    return monthStartUtc(2000 + yy, month);
  }

  match = /^(\d{1,2})\/(\d{4})$/.exec(s);
  if (match) {
    const month = Number(match[1]);
    const year = Number(match[2]);
    if (month < 1 || month > 12) return null;
    return monthStartUtc(year, month);
  }

  return null;
}

export function formatAsicExpiryMonth(date: Date): string {
  const month = date.getUTCMonth() + 1;
  const year = date.getUTCFullYear() % 100;
  return `${String(month).padStart(2, "0")}/${String(year).padStart(2, "0")}`;
}

/** Value for `<input type="month">` from an API MM/YY string. */
export function asicExpiryToMonthInputValue(mmYy: string): string {
  const parsed = parseAsicExpiryMonth(mmYy);
  if (!parsed) return "";
  const year = parsed.getUTCFullYear();
  const month = parsed.getUTCMonth() + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}

function monthStartUtc(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1, 12, 0, 0, 0));
}

/** Last day of the expiry month — cards remain valid through that month. */
export function lastDayOfAsicExpiryMonth(expiryDate: Date): Date {
  const year = expiryDate.getUTCFullYear();
  const month = expiryDate.getUTCMonth();
  return new Date(Date.UTC(year, month + 1, 0, 12, 0, 0, 0));
}

export function daysUntilAsicExpiry(expiryDate: Date): number {
  const today = new Date();
  today.setUTCHours(12, 0, 0, 0);
  const exp = lastDayOfAsicExpiryMonth(expiryDate);
  return Math.ceil((exp.getTime() - today.getTime()) / 86400000);
}

export function isAsicExpiringSoon(expiryDate: Date, withinDays: number): boolean {
  const days = daysUntilAsicExpiry(expiryDate);
  return days >= 0 && days <= withinDays;
}

export function isAsicExpired(expiryDate: Date): boolean {
  return daysUntilAsicExpiry(expiryDate) < 0;
}
