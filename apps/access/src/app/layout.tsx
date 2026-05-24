import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PortTools Access register",
  description: "Staff ASIC and FOB register for port managers.",
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
