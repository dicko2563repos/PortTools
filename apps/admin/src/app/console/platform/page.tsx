import { AdminChangePasswordForm, AdminCredentialsConsole } from "@porttools/ui";
import { getSession } from "@/lib/session";

export default async function AdminPlatformPage() {
  const session = await getSession();
  if (!session) return null;

  return (
    <div className="space-y-12">
      <AdminCredentialsConsole currentAdminId={session.adminId} />
      <AdminChangePasswordForm />
    </div>
  );
}
