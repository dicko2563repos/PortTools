import { redirect } from "next/navigation";

export default function LegacyConsoleRedirect() {
  redirect("/console/platform");
}
