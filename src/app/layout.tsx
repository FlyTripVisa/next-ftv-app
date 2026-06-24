import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlyTripVisa — AI Agent",
  description: "Real-time AI development assistant powered by Cloudflare Workers AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
