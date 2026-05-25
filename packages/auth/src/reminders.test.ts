import { describe, expect, it } from "vitest";
import {
  ASIC_REMINDER_DAYS,
  asicReminderLinesForRecords,
  buildAsicReminderEmail,
  buildComplianceReminderEmail,
} from "./reminders";
import { daysUntilAsicExpiry } from "./asic-expiry";

describe("daysUntilAsicExpiry", () => {
  it("counts to the last day of the expiry month", () => {
    const expiry = new Date("2026-05-01T12:00:00.000Z");
    const today = new Date("2026-05-31T12:00:00.000Z");
    expect(daysUntilAsicExpiry(expiry, today)).toBe(0);
  });

  it("returns 30 exactly on the 30-day reminder date", () => {
    const expiry = new Date("2026-06-01T12:00:00.000Z");
    const today = new Date("2026-05-31T12:00:00.000Z");
    expect(daysUntilAsicExpiry(expiry, today)).toBe(30);
  });
});

describe("asicReminderLinesForRecords", () => {
  it("includes records only on exact reminder days", () => {
    const today = new Date("2026-05-31T12:00:00.000Z");
    const records = [
      { name: "Alice", asicNumber: "A1", expiryDate: new Date("2026-06-01T12:00:00.000Z") },
      { name: "Bob", asicNumber: "B1", expiryDate: new Date("2026-08-01T12:00:00.000Z") },
    ];

    const lines = asicReminderLinesForRecords(records, today);
    expect(lines).toHaveLength(1);
    expect(lines[0]?.name).toBe("Alice");
    expect(lines[0]?.daysUntilExpiry).toBe(30);
    expect(ASIC_REMINDER_DAYS).toContain(lines[0]?.daysUntilExpiry);
  });

  it("skips records between reminder thresholds", () => {
    const today = new Date("2026-06-01T12:00:00.000Z");
    const records = [
      { name: "Alice", asicNumber: "A1", expiryDate: new Date("2026-06-01T12:00:00.000Z") },
    ];
    expect(asicReminderLinesForRecords(records, today)).toHaveLength(0);
  });
});

describe("buildComplianceReminderEmail", () => {
  it("builds subject and overdue lines", () => {
    const { subject, text } = buildComplianceReminderEmail({
      portCode: "KGC",
      year: 2026,
      lines: ["Weekly A — Jan w1"],
    });
    expect(subject).toBe("KGC — compliance overdue (2026)");
    expect(text).toContain("Weekly A — Jan w1");
    expect(text).toContain("pcr.porttools.com.au");
  });
});

describe("buildAsicReminderEmail", () => {
  it("builds subject and staff lines", () => {
    const { subject, text } = buildAsicReminderEmail({
      portCode: "KGC",
      lines: [
        {
          name: "Alice",
          asicNumber: "A1",
          expiryLabel: "07/26",
          daysUntilExpiry: 30,
        },
      ],
    });
    expect(subject).toBe("KGC — ASIC expiry reminder");
    expect(text).toContain("Alice (A1)");
    expect(text).toContain("access.porttools.com.au");
  });
});
