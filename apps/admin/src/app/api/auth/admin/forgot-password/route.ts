import { isResendConfigured, sendAdminPasswordResetEmail } from "@porttools/auth";
import { NextResponse } from "next/server";
import { parseJsonBody, withApiErrorHandling } from "@/lib/api-error";
import { authStore } from "@/lib/auth-store";
import { enforceLoginRateLimit } from "@/lib/login-rate-limit";
import { APP_URL } from "@/lib/support";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PRODUCT_NAME = "PortTools Admin";

export async function POST(request: Request) {
  return withApiErrorHandling("POST /api/auth/admin/forgot-password", async () => {
    const rateLimited = await enforceLoginRateLimit(request, "admin_forgot");
    if (rateLimited) return rateLimited;

    if (!isResendConfigured()) {
      return NextResponse.json(
        { error: "Email reset is not configured on this server." },
        { status: 503 }
      );
    }

    const body = (await parseJsonBody(request)) as { email?: string };
    const email = body.email?.trim().toLowerCase() ?? "";

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const created = await authStore.createAdminPasswordResetToken(email);
    if (created) {
      const resetUrl = `${APP_URL}/login/reset?token=${encodeURIComponent(created.token)}`;
      const sent = await sendAdminPasswordResetEmail({
        to: created.email,
        resetUrl,
        productName: PRODUCT_NAME,
      });
      if (!sent.ok) {
        console.error("[admin-forgot-password] email send failed:", sent.error);
      }
    }

    return NextResponse.json({ ok: true });
  });
}
