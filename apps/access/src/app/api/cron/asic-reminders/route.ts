import {
  asicReminderLinesForRecords,
  buildAsicReminderEmail,
  isAuthorizedCronRequest,
  isResendConfigured,
  sendResendEmail,
} from "@porttools/auth";
import { NextResponse } from "next/server";
import { PUBLIC_ERRORS, withApiErrorHandling } from "@/lib/api-error";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  return withApiErrorHandling("GET /api/cron/asic-reminders", async () => {
    if (!isAuthorizedCronRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isResendConfigured()) {
      return NextResponse.json({ error: "Email is not configured" }, { status: 503 });
    }

    const ports = await prisma.authPort.findMany({
      where: {
        isActive: true,
        asicReminderEmailsEnabled: true,
        loginEmail: { not: null },
      },
      select: { code: true, loginEmail: true },
    });

    let sent = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const authPort of ports) {
      const loginEmail = authPort.loginEmail?.trim();
      if (!loginEmail) {
        skipped += 1;
        continue;
      }

      const movementsPort = await prisma.port.findFirst({
        where: { code: authPort.code, isActive: true },
        select: { id: true },
      });
      if (!movementsPort) {
        skipped += 1;
        continue;
      }

      const records = await prisma.staffAsicRecord.findMany({
        where: { portId: movementsPort.id },
        select: { name: true, asicNumber: true, expiryDate: true },
      });

      const lines = asicReminderLinesForRecords(records);
      if (lines.length === 0) {
        skipped += 1;
        continue;
      }

      const { subject, text } = buildAsicReminderEmail({
        portCode: authPort.code,
        lines,
      });

      const result = await sendResendEmail({ to: loginEmail, subject, text });
      if (!result.ok) {
        errors.push(`${authPort.code}: ${result.error}`);
        continue;
      }

      sent += 1;
    }

    return NextResponse.json({
      ok: true,
      candidates: ports.length,
      sent,
      skipped,
      errors,
    });
  }, { fallback: PUBLIC_ERRORS.loadFailed });
}
