import { describe, expect, it, vi, afterEach } from "vitest";
import {
  asicExpiryToMonthInputValue,
  daysUntilAsicExpiry,
  formatAsicExpiryMonth,
  isAsicExpired,
  parseAsicExpiryMonth,
} from "./asic-expiry";

describe("parseAsicExpiryMonth", () => {
  it("parses MM/YY and stores the first of the month", () => {
    const d = parseAsicExpiryMonth("05/26");
    expect(d?.toISOString()).toBe("2026-05-01T12:00:00.000Z");
  });

  it("parses YYYY-MM from month inputs", () => {
    const d = parseAsicExpiryMonth("2026-05");
    expect(d?.toISOString()).toBe("2026-05-01T12:00:00.000Z");
  });

  it("normalizes legacy YYYY-MM-DD to month start", () => {
    const d = parseAsicExpiryMonth("2026-05-15");
    expect(d?.toISOString()).toBe("2026-05-01T12:00:00.000Z");
  });
});

describe("formatAsicExpiryMonth", () => {
  it("formats as MM/YY", () => {
    const d = parseAsicExpiryMonth("05/26")!;
    expect(formatAsicExpiryMonth(d)).toBe("05/26");
  });
});

describe("asicExpiryToMonthInputValue", () => {
  it("converts MM/YY for month picker", () => {
    expect(asicExpiryToMonthInputValue("05/26")).toBe("2026-05");
  });
});

describe("expiry through end of month", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is not expired on the last day of the expiry month", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-31T12:00:00.000Z"));
    const expiry = parseAsicExpiryMonth("05/26")!;
    expect(isAsicExpired(expiry)).toBe(false);
    expect(daysUntilAsicExpiry(expiry)).toBe(0);
  });

  it("is expired from the first day of the following month", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T12:00:00.000Z"));
    const expiry = parseAsicExpiryMonth("05/26")!;
    expect(isAsicExpired(expiry)).toBe(true);
  });
});
