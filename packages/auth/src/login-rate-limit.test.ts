import { afterEach, describe, expect, it } from "vitest";
import {
  checkLoginRateLimit,
  resetLoginRateLimitMemoryForTests,
} from "./login-rate-limit";

describe("checkLoginRateLimit", () => {
  afterEach(() => {
    resetLoginRateLimitMemoryForTests();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    process.env.LOGIN_RATE_LIMIT_MAX = "3";
    process.env.LOGIN_RATE_LIMIT_WINDOW_SEC = "60";
  });

  it("allows attempts under the limit", async () => {
    const req = new Request("http://localhost/api/auth/port/login");
    for (let i = 0; i < 3; i++) {
      const result = await checkLoginRateLimit(req, "port", "203.0.113.1");
      expect(result.limited).toBe(false);
    }
  });

  it("blocks after max attempts from same IP", async () => {
    const req = new Request("http://localhost/api/auth/port/login");
    const ip = "203.0.113.2";
    for (let i = 0; i < 3; i++) {
      await checkLoginRateLimit(req, "port", ip);
    }
    const blocked = await checkLoginRateLimit(req, "port", ip);
    expect(blocked.limited).toBe(true);
    if (blocked.limited) {
      expect(blocked.retryAfterSec).toBeGreaterThan(0);
    }
  });

  it("tracks port and admin scopes separately", async () => {
    const req = new Request("http://localhost/api/auth/port/login");
    const ip = "203.0.113.3";
    for (let i = 0; i < 3; i++) {
      await checkLoginRateLimit(req, "port", ip);
    }
    const adminAttempt = await checkLoginRateLimit(req, "admin", ip);
    expect(adminAttempt.limited).toBe(false);
  });
});
