import { redirect } from "next/navigation";
import { AdminConsoleNav } from "@porttools/ui";
import { AdminConsoleHeader } from "@/components/AdminConsoleHeader";
import { LogoutButton } from "@/components/LogoutButton";
import { getSession } from "@/lib/session";
import { ACCESS_APP_URL } from "@/lib/support";

export default async function AdminConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <AdminConsoleHeader email={session.email} logout={<LogoutButton />} />
      <AdminConsoleNav accessAppUrl={ACCESS_APP_URL} />
      {children}
    </main>
  );
}
