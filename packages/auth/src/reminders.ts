import { daysUntilAsicExpiry, formatAsicExpiryMonth } from "./asic-expiry";

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

export function buildPmsLastDayReminderEmail(input: {
  portCode: string;
  periodLabel: string;
  year: number;
}): { subject: string; text: string } {
  const subject = `${input.portCode} — send movement report today (${input.periodLabel})`;
  const text = [
    `${input.portCode} — Port Movement Summary`,
    "",
    `Today is the last day of ${input.periodLabel} ${input.year}.`,
    "After the last flight for the day, sign in and send the period report.",
    "",
    "Sign in at https://pms.porttools.com.au or https://porttools.com.au",
    "",
    "Managers can turn off last-day reminder emails in PMS (overdue reminders are always sent).",
  ].join("\n");
  return { subject, text };
}

export function buildPmsOverduePeriodReminderEmail(input: {
  portCode: string;
  periodLabel: string;
  year: number;
  endDateLabel: string;
}): { subject: string; text: string } {
  const subject = `${input.portCode} — movement report overdue (${input.periodLabel})`;
  const text = [
    `${input.portCode} — Port Movement Summary`,
    "",
    `${input.periodLabel} ${input.year} ended on ${input.endDateLabel} and the report has not been sent.`,
    "Please sign in, complete any final entries, and send the period report.",
    "",
    "Sign in at https://pms.porttools.com.au or https://porttools.com.au",
  ].join("\n");
  return { subject, text };
}
