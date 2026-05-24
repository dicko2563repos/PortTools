import { NextResponse } from "next/server";
import { parseJsonBody, withApiErrorHandling } from "@/lib/api-error";
import { authStore } from "@/lib/auth-store";
import { enforceLoginRateLimit } from "@/lib/login-rate-limit";

const MAX_PASSWORD_LEN = 128;

export async function POST(request: Request) {
  return withApiErrorHandling("POST /api/auth/admin/reset-password", async () => {
    const rateLimited = await enforceLoginRateLimit(request, "admin_reset");
    if (rateLimited) return rateLimited;

    const body = (await parseJsonBody(request)) as {
      token?: string;
      newPassword?: string;
    };

    const token = body.token?.trim() ?? "";
    const newPassword = body.newPassword ?? "";

    if (!token || newPassword.length < 8 || newPassword.length > MAX_PASSWORD_LEN) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const result = await authStore.resetAdminPasswordWithToken(token, newPassword);
    if (!result.ok) {
      if (result.reason === "weak_password") {
        return NextResponse.json(
          { error: "Password must be 8–128 characters" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "This reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  });
}
