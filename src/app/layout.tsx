import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import { prisma } from "@/lib/prisma";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

async function getSettings() {
  try {
    const settings = await prisma.systemSettings.findMany({
      where: {
        key: { in: ["websiteTitle", "metaDescription", "faviconUrl", "platformName"] }
      }
    });
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => {
      try {
        settingsMap[s.key] = JSON.parse(s.value);
      } catch {
        settingsMap[s.key] = s.value;
      }
    });
    return settingsMap;
  } catch {
    return {};
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  
  // Use faviconUrl from settings if it's a full URL, otherwise fall back to default
  const faviconUrl = settings.faviconUrl && 
    (settings.faviconUrl.startsWith('http://') || settings.faviconUrl.startsWith('https://')) 
    ? `${settings.faviconUrl}?v=${Date.now()}` // Add cache buster
    : undefined;
  
  return {
    title: settings.websiteTitle || settings.platformName || "Loft",
    description: settings.metaDescription || "Your digital learning platform",
    icons: faviconUrl ? { icon: faviconUrl } : { icon: "/favicon.ico" },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
