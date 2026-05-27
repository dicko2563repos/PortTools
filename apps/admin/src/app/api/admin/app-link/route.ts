import { NextResponse } from "next/server";
import {
  adminCrossAppSsoBridgeUrl,
  createAdminCrossAppSsoToken,
} from "@porttools/auth";
import { getSession } from "@/lib/session";
import { PCR_APP_URL, PMS_APP_URL } from "@/lib/support";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const app = url.searchParams.get("app");
  const path = url.searchParams.get("path");

  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const origin = app === "pms" ? PMS_APP_URL : app === "pcr" ? PCR_APP_URL : null;
  if (!origin) {
    return NextResponse.json({ error: "Invalid app" }, { status: 400 });
  }

  const token = await createAdminCrossAppSsoToken({
    adminId: session.adminId,
    email: session.email,
    returnPath: path,
  });

  return NextResponse.json({
    url: adminCrossAppSsoBridgeUrl(origin, path, token),
  });
}
