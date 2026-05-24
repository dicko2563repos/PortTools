import { NextResponse } from "next/server";
import { authStore } from "@/lib/auth-store";
import { parseJsonBody, withApiErrorHandling } from "@/lib/api-error";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  return withApiErrorHandling("admin/change-password", async () => {
    const session = await getSession();
    if (!session || session.type !== "admin") {
      return NextResponse.json({ error: "Admin required" }, { status: 401 });
    }

    const body = (await parseJsonBody(request)) as {
      currentPassword?: string;
      newPassword?: string;
    };

    const currentPassword = body.currentPassword ?? "";
    const newPassword = body.newPassword ?? "";

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current and new password are required." },
        { status: 400 }
      );
    }

    const result = await authStore.changeAdminPassword(
      session.adminId,
      currentPassword,
      newPassword
    );

    if (!result.ok) {
      if (result.reason === "weak_password") {
        return NextResponse.json(
          { error: "New password must be 8–128 characters." },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  });
}
