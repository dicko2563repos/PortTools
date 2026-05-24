import { authStore } from "@/lib/auth-store";
import type { SessionPayload } from "@/lib/session";

export async function authenticateAdmin(
  email: string,
  password: string
): Promise<SessionPayload | null> {
  const verified = await authStore.verifyAdminLogin(email, password);
  if (!verified) return null;
  return { type: "admin", adminId: verified.adminId, email: verified.email };
}
