import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { APP_CONFIG } from "@/config/app";

export const metadata: Metadata = {
  title: APP_CONFIG.appName,
  description: "Production-grade multi-tenant SaaS starter",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
