import { createHash, randomBytes } from "crypto";

export const ADMIN_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export function generateAdminResetToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashAdminResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
