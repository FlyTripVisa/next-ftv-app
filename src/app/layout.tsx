import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "FLYTRIPVISA · AI Travel Assistant",
  description: "Cloudflare D1 + Workers AI powered visa and travel platform",
  viewport: "width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}