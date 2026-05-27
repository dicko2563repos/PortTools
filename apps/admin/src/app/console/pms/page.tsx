import { redirect } from "next/navigation";
import {
  adminCrossAppSsoBridgeUrl,
  createAdminCrossAppSsoToken,
} from "@porttools/auth";
import { getSession } from "@/lib/session";
import { PMS_APP_URL } from "@/lib/support";

/** Legacy route — movement reports open directly from the nav link. */
export default async function AdminPmsRedirectPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const token = await createAdminCrossAppSsoToken({
    adminId: session.adminId,
    email: session.email,
    returnPath: "/reports",
  });
  redirect(adminCrossAppSsoBridgeUrl(PMS_APP_URL, "/reports", token));
}
