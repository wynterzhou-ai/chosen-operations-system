import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chosen Operations System",
  description: "Cleaning operations management system"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
