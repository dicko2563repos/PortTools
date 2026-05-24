export function normalizeAccessPin(pin: string): string {
  return pin.trim();
}

/** Numeric PIN, 4–8 digits (admin-set per port). */
export function isValidAccessPin(pin: string): boolean {
  return /^\d{4,8}$/.test(normalizeAccessPin(pin));
}
