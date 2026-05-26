import { describe, expect, it } from "vitest";
import { secondsUntilNextMonday } from "./app-port-session";

describe("secondsUntilNextMonday", () => {
  it("returns seven days from Monday midday Brisbane", () => {
    // 2026-05-25 02:00 UTC = Mon 12:00 AEST (Brisbane)
    const from = new Date("2026-05-25T02:00:00.000Z");
    expect(secondsUntilNextMonday(from)).toBe(7 * 86400 - 12 * 3600);
  });

  it("returns one day from Sunday Brisbane", () => {
    // 2026-05-31 05:00 UTC = Sun 15:00 AEST (Brisbane)
    const from = new Date("2026-05-31T05:00:00.000Z");
    expect(secondsUntilNextMonday(from)).toBe(9 * 3600);
  });
});
