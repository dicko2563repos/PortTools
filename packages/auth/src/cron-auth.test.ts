import { describe, expect, it } from "vitest";
import { isAuthorizedCronRequest } from "./cron-auth";

describe("isAuthorizedCronRequest", () => {
  it("rejects when CRON_SECRET is unset", () => {
    const prev = process.env.CRON_SECRET;
    delete process.env.CRON_SECRET;
    expect(isAuthorizedCronRequest(new Request("http://localhost/api/cron"))).toBe(false);
    process.env.CRON_SECRET = prev;
  });

  it("accepts Authorization Bearer header", () => {
    process.env.CRON_SECRET = "test-secret";
    const request = new Request("http://localhost/api/cron", {
      headers: { authorization: "Bearer test-secret" },
    });
    expect(isAuthorizedCronRequest(request)).toBe(true);
  });

  it("accepts x-cron-secret header", () => {
    process.env.CRON_SECRET = "test-secret";
    const request = new Request("http://localhost/api/cron", {
      headers: { "x-cron-secret": "test-secret" },
    });
    expect(isAuthorizedCronRequest(request)).toBe(true);
  });

  it("rejects wrong secret", () => {
    process.env.CRON_SECRET = "test-secret";
    const request = new Request("http://localhost/api/cron", {
      headers: { authorization: "Bearer wrong" },
    });
    expect(isAuthorizedCronRequest(request)).toBe(false);
  });
});
