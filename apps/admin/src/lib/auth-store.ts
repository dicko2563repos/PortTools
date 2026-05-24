import { createAuthStore, type AuthStoreClient } from "@porttools/auth";
import { prisma } from "@/lib/db";

export const authStore = createAuthStore(prisma as unknown as AuthStoreClient);
