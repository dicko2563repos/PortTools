import { Prisma, type PrismaClient } from "@prisma/client";

export async function getReportEmailsByPortCodes(
  prisma: PrismaClient,
  codes: string[]
): Promise<Map<string, string>> {
  if (codes.length === 0) return new Map();

  const rows = await prisma.$queryRaw<Array<{ code: string; email_to: string }>>`
    SELECT code, email_to
    FROM movements.ports
    WHERE code IN (${Prisma.join(codes)})
  `;

  return new Map(rows.map((row) => [row.code, row.email_to ?? ""]));
}

export async function setReportEmailForPortCode(
  prisma: PrismaClient,
  code: string,
  emailTo: string
): Promise<boolean> {
  const updated = await prisma.$executeRaw`
    UPDATE movements.ports
    SET email_to = ${emailTo}
    WHERE code = ${code}
  `;
  return Number(updated) > 0;
}
