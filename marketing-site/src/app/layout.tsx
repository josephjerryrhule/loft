import type { Metadata } from "next";
import { Quicksand, Inter } from "next/font/google";
import "./globals.css";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "LOFT — Build Confidence Through Stories That Feel Like Home",
  description:
    "Interactive reading adventures children love, rooted in culture, imagination, and confidence-building. From magical 3D storybooks and personalized birthday stories to habit-forming reading experiences, LOFT helps children grow while parents feel confident.",
  keywords: [
    "LOFT",
    "Land of Fairy Tales",
    "children reading",
    "interactive storybooks",
    "personalized children books",
    "reading habit",
    "African stories for children",
    "Ghana stories for kids",
  ],
  openGraph: {
    title: "LOFT — Build Confidence Through Stories That Feel Like Home",
    description:
      "Interactive reading adventures children love, rooted in culture, imagination, and confidence-building.",
    type: "website",
    locale: "en_US",
    siteName: "LOFT",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${quicksand.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-inter bg-brand-cream text-text-dark">
        {children}
      </body>
    </html>
  );
}
