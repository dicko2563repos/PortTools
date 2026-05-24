import type { Metadata } from "next";
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
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
