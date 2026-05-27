import {
  AdminPmsReportsPanel,
} from "@porttools/ui";
import {
  adminCrossAppSsoBridgeUrl,
  createAdminCrossAppSsoToken,
} from "@porttools/auth";
import { getSession } from "@/lib/session";
import { PMS_APP_URL } from "@/lib/support";

export default async function AdminPmsPage() {
  const session = await getSession();
  if (!session) return null;

  const token = await createAdminCrossAppSsoToken({
    adminId: session.adminId,
    email: session.email,
    returnPath: "/reports",
  });
  const reportsUrl = adminCrossAppSsoBridgeUrl(PMS_APP_URL, "/reports", token);

  return (
    <div className="space-y-8">
      <AdminPmsReportsPanel reportsUrl={reportsUrl} />
    </div>
  );
}
