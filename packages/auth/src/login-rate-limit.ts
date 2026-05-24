import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type LoginRateLimitScope = "port" | "admin" | "reports" | "admin_forgot" | "admin_reset";

export type LoginRateLimitResult =
  | { limited: false }
  | { limited: true; retryAfterSec: number };

type MemoryEntry = { count: number; windowStartMs: number };

const memoryStore = new Map<string, MemoryEntry>();

let upstashLimiter: Ratelimit | null | undefined;
let warnedMissingUpstash = false;

function maxAttempts(): number {
  const raw = Number(process.env.LOGIN_RATE_LIMIT_MAX ?? 10);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 10;
}

function windowSec(): number {
  const raw = Number(process.env.LOGIN_RATE_LIMIT_WINDOW_SEC ?? 900);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 900;
}

function getUpstashLimiter(): Ratelimit | null {
  if (upstashLimiter !== undefined) return upstashLimiter;

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    upstashLimiter = null;
    return null;
  }

  upstashLimiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(maxAttempts(), `${windowSec()} s`),
    prefix: "porttools:login",
  });
  return upstashLimiter;
}

function checkMemoryRateLimit(key: string): LoginRateLimitResult {
  const max = maxAttempts();
  const windowMs = windowSec() * 1000;
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now - entry.windowStartMs >= windowMs) {
    memoryStore.set(key, { count: 1, windowStartMs: now });
    return { limited: false };
  }

  if (entry.count >= max) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((entry.windowStartMs + windowMs - now) / 1000)
    );
    return { limited: true, retryAfterSec };
  }

  entry.count += 1;
  memoryStore.set(key, entry);
  return { limited: false };
}

/** Reset memory store — for tests only. */
export function resetLoginRateLimitMemoryForTests(): void {
  memoryStore.clear();
  upstashLimiter = undefined;
  warnedMissingUpstash = false;
}

export async function checkLoginRateLimit(
  _request: Request,
  scope: LoginRateLimitScope,
  clientIp: string
): Promise<LoginRateLimitResult> {
  const key = `${scope}:${clientIp}`;
  const limiter = getUpstashLimiter();

  if (limiter) {
    const result = await limiter.limit(key);
    if (!result.success) {
      const retryAfterSec = Math.max(
        1,
        Math.ceil((result.reset - Date.now()) / 1000)
      );
      return { limited: true, retryAfterSec };
    }
    return { limited: false };
  }

  if (process.env.NODE_ENV === "production" && !warnedMissingUpstash) {
    warnedMissingUpstash = true;
    console.warn(
      "[login-rate-limit] UPSTASH_REDIS_REST_URL not set — using in-memory limiter (best-effort on serverless)"
    );
  }

  return checkMemoryRateLimit(key);
}
