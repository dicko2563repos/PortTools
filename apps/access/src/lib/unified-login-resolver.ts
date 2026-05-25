import { createUnifiedLoginPortResolver } from "@porttools/auth";
import { prisma } from "@/lib/db";

export const unifiedLoginPortResolver = createUnifiedLoginPortResolver({
  authPort: prisma.authPort,
  publicPort: {
    findUnique: async ({ where }) => {
      const rows = await prisma.$queryRaw<Array<{ id: string; code: string }>>`
        SELECT id, code
        FROM public.ports
        WHERE code = ${where.code}
          AND is_active = true
        LIMIT 1
      `;
      return rows[0] ?? null;
    },
  },
  movementsPort: prisma.port,
});
