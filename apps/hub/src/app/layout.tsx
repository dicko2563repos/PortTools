import type { Metadata } from "next";
import { TabSessionGuard, TAB_SESSION_KEYS } from "@porttools/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: "Precision Aviation Services PortTools",
  description: "PortTools hub — links to Port Compliance Record, Port Movement Summary, and PTS Calc.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <TabSessionGuard storageKey={TAB_SESSION_KEYS.hub} loginPath="/">
          {children}
        </TabSessionGuard>
      </body>
    </html>
  );
}
