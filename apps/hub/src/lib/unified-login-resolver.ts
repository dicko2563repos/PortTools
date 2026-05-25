import { createUnifiedLoginPortResolver } from "@porttools/auth";
import { prisma } from "@/lib/db";

export const unifiedLoginPortResolver = createUnifiedLoginPortResolver({
  authPort: prisma.authPort,
  publicPort: prisma.publicPort,
  movementsPort: prisma.movementsPort,
});
