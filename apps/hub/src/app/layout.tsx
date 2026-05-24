import type { Metadata } from "next";
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
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
