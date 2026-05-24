import { authStore } from "@/lib/auth-store";
import type { SessionPayload } from "@/lib/session";

export async function authenticateManager(
  email: string,
  password: string
): Promise<Extract<SessionPayload, { type: "manager" }> | null> {
  const verified = await authStore.verifyManagerLogin(email, password);
  if (!verified) return null;
  return {
    type: "manager",
    managerId: verified.managerId,
    email: verified.email,
    authPortIds: verified.authPortIds,
  };
}
