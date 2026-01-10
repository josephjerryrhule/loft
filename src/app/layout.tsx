import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import { prisma } from "@/lib/prisma";
import { FaviconUpdater } from "@/components/FaviconUpdater";
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
  
  // Use faviconUrl from settings if available
  const faviconUrl = settings.faviconUrl || "/favicon.ico";
  
  // Create metadata with proper icon configuration
  const icons: Metadata['icons'] = {};
  
  if (settings.faviconUrl) {
    // For custom favicons, use the full URL with multiple sizes
    icons.icon = [
      { url: faviconUrl, sizes: '32x32', type: 'image/x-icon' },
      { url: faviconUrl, sizes: '16x16', type: 'image/x-icon' },
    ];
    icons.apple = faviconUrl;
  } else {
    // Default favicon
    icons.icon = "/favicon.ico";
  }
  
  return {
    title: settings.websiteTitle || settings.platformName || "Loft",
    description: settings.metaDescription || "Your digital learning platform",
    icons,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();
  
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <FaviconUpdater faviconUrl={settings.faviconUrl} />
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
