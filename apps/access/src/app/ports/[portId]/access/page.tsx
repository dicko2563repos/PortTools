import { NextResponse } from "next/server";
import { redirect, notFound } from "next/navigation";
import { AccessRegisterClient } from "@/components/AccessRegisterClient";
import { LogoutButton } from "@/components/LogoutButton";
import { requireManagerPort } from "@/lib/access-register";
import { getSession } from "@/lib/session";

type PageProps = { params: Promise<{ portId: string }> };

export default async function AccessRegisterPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { portId } = await params;
  const portResult = await requireManagerPort(portId, session);
  if (portResult instanceof NextResponse) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="mb-6 flex justify-end">
        <LogoutButton />
      </div>
      <AccessRegisterClient port={portResult} />
    </main>
  );
}
