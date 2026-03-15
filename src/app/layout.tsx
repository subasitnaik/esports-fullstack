import type { Metadata } from "next";
import "./globals.css";
import { brand } from "@config/brand";

export const metadata: Metadata = {
  title: brand.meta.title,
  description: brand.meta.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-base">
      <body className="min-h-screen bg-base text-[var(--text)] antialiased">
        {children}
      </body>
    </html>
  );
}
