import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/src/components/ui/toast";
import { ThemeProvider } from "@/src/components/ui/theme-provider";
import { LanguageProvider } from "@/src/contexts/language-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fluvex - Gestion de Flotte",
  description: "Plateforme de gestion de flotte et livraisons",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-text-main`}
      >
        <ThemeProvider>
          <LanguageProvider>
            <ToastProvider>
              <Suspense fallback={null}>{children}</Suspense>
            </ToastProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
