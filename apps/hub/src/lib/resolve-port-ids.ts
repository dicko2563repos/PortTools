import { prisma } from "@/lib/db";

export async function resolvePortIdsByCode(
  code: string
): Promise<{ publicPortId: string; movementsPortId: string } | null> {
  const [publicPort, movementsPort] = await Promise.all([
    prisma.publicPort.findUnique({ where: { code }, select: { id: true } }),
    prisma.movementsPort.findUnique({ where: { code }, select: { id: true } }),
  ]);

  if (!publicPort || !movementsPort) return null;
  return { publicPortId: publicPort.id, movementsPortId: movementsPort.id };
}
