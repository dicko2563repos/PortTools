/** ASIC email reminders fire when expiry is exactly this many days away. */
export const ASIC_REMINDER_DAYS = [7, 30, 60] as const;

export type AsicReminderLine = {
  name: string;
  asicNumber: string;
  expiryLabel: string;
  daysUntilExpiry: number;
};

export function asicReminderLinesForRecords(
  records: Array<{ name: string; asicNumber: string; expiryDate: Date }>,
  today: Date = new Date()
): AsicReminderLine[] {
  const lines: AsicReminderLine[] = [];

  for (const record of records) {
    const days = daysUntilAsicExpiry(record.expiryDate, today);
    if (!ASIC_REMINDER_DAYS.includes(days as (typeof ASIC_REMINDER_DAYS)[number])) {
      continue;
    }
    lines.push({
      name: record.name,
      asicNumber: record.asicNumber,
      expiryLabel: formatAsicExpiryMonth(record.expiryDate),
      daysUntilExpiry: days,
    });
  }

  lines.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry || a.name.localeCompare(b.name));
  return lines;
}

function monthStartUtc(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1, 12, 0, 0, 0));
}

function lastDayOfAsicExpiryMonth(expiryDate: Date): Date {
  const year = expiryDate.getUTCFullYear();
  const month = expiryDate.getUTCMonth();
  return new Date(Date.UTC(year, month + 1, 0, 12, 0, 0, 0));
}

function daysUntilAsicExpiry(expiryDate: Date, today: Date): number {
  const day = new Date(today);
  day.setUTCHours(12, 0, 0, 0);
  const exp = lastDayOfAsicExpiryMonth(expiryDate);
  return Math.ceil((exp.getTime() - day.getTime()) / 86400000);
}

function formatAsicExpiryMonth(date: Date): string {
  const month = date.getUTCMonth() + 1;
  const year = date.getUTCFullYear() % 100;
  return `${String(month).padStart(2, "0")}/${String(year).padStart(2, "0")}`;
}

export function buildComplianceReminderEmail(input: {
  portCode: string;
  year: number;
  lines: string[];
}): { subject: string; text: string } {
  const subject = `${input.portCode} — compliance overdue (${input.year})`;
  const text = [
    `${input.portCode} — Port Compliance Record ${input.year}`,
    "",
    `${input.lines.length} overdue ${input.lines.length === 1 ? "item" : "items"}:`,
    "",
    ...input.lines.map((line) => `• ${line}`),
    "",
    "Sign in at https://porttools.com.au or https://pcr.porttools.com.au to update your record.",
    "",
    "To turn off these emails, open PCR as a manager and disable compliance reminder emails.",
  ].join("\n");
  return { subject, text };
}

export function buildAsicReminderEmail(input: {
  portCode: string;
  lines: AsicReminderLine[];
}): { subject: string; text: string } {
  const subject = `${input.portCode} — ASIC expiry reminder`;
  const text = [
    `${input.portCode} — staff ASIC expiry reminder`,
    "",
    ...input.lines.map(
      (line) =>
        `• ${line.name} (${line.asicNumber}) — expires ${line.expiryLabel} (${line.daysUntilExpiry} days)`
    ),
    "",
    "Sign in at https://porttools.com.au or https://access.porttools.com.au to review the register.",
    "",
    "To turn off these emails, open the access register as a manager and disable ASIC reminder emails.",
  ].join("\n");
  return { subject, text };
}
