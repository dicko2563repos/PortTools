import { describe, expect, it, afterEach, vi } from "vitest";
import { daysUntilAsicExpiry as authDaysUntilAsicExpiry } from "@porttools/auth";
import { daysUntilAsicExpiry as accessDaysUntilAsicExpiry } from "./asic-expiry";

describe("ASIC expiry parity with @porttools/auth", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("matches cron reminder day counts for register badges", () => {
    vi.useFakeTimers();
    const today = new Date("2026-05-31T12:00:00.000Z");
    vi.setSystemTime(today);
    const expiry = new Date("2026-06-01T12:00:00.000Z");
    expect(accessDaysUntilAsicExpiry(expiry)).toBe(authDaysUntilAsicExpiry(expiry, today));
  });
});
