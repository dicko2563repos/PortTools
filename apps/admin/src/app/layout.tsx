import type { Metadata } from "next";
import { TabSessionGuard, TAB_SESSION_KEYS } from "@porttools/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: "PortTools Admin console",
  description: "Platform administration for PortTools apps.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <TabSessionGuard storageKey={TAB_SESSION_KEYS.admin}>{children}</TabSessionGuard>
      </body>
    </html>
  );
}
