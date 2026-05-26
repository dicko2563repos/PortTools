const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_RECIPIENT_LEN = 254;

/** Parse comma-separated report recipients; empty string clears. Returns null if invalid. */
export function parseReportEmailRecipients(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const parts = trimmed
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return "";

  for (const email of parts) {
    if (/[\r\n]/.test(email) || email.length > MAX_RECIPIENT_LEN || !EMAIL_RE.test(email)) {
      return null;
    }
  }

  return parts.join(", ");
}

/** Split stored report email field into Resend `to` list. */
export function reportEmailRecipientList(emailTo: string): string[] {
  return emailTo
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}
