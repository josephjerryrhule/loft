import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";

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

import { Quicksand, Nunito_Sans } from "next/font/google";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
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
  
  // Default favicon
  icons.icon = settings.faviconUrl || "/favicon.ico";
  if (settings.faviconUrl) {
    icons.apple = settings.faviconUrl;
  }
  
  return {
    title: settings.websiteTitle || settings.platformName || "Loft",
    description: settings.metaDescription || "Your digital learning platform",
    icons,
  };
}

import { Providers } from "@/components/providers";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();
  const cloudflareWebAnalyticsToken = process.env.NEXT_PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN;
  
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${quicksand.variable} ${nunitoSans.variable} antialiased`}
      >
        <FaviconUpdater faviconUrl={settings.faviconUrl} />
        {cloudflareWebAnalyticsToken ? (
          <Script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({ token: cloudflareWebAnalyticsToken })}
            strategy="afterInteractive"
          />
        ) : null}
        <Providers>
          {children}
        </Providers>
        <Toaster />

      </body>
    </html>
  );
}
