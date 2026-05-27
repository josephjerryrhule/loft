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
  title: "Land of Fairy Tales — Build Confidence Through Stories That Feel Like Home",
  description:
    "Interactive reading adventures children love, rooted in culture, imagination, and confidence-building. From magical 3D storybooks and personalized birthday stories to habit-forming reading experiences, Land of Fairy Tales helps children grow while parents feel confident.",
  keywords: [
    "Land of Fairy Tales",
    "children reading",
    "interactive storybooks",
    "personalized children books",
    "reading habit",
    "African stories for children",
    "Ghana stories for kids",
  ],
  metadataBase: new URL("https://www.landoffairytales.com"),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Land of Fairy Tales — Build Confidence Through Stories That Feel Like Home",
    description:
      "Interactive reading adventures children love, rooted in culture, imagination, and confidence-building.",
    type: "website",
    locale: "en_US",
    siteName: "Land of Fairy Tales",
    url: "https://www.landoffairytales.com",
    images: [
      {
        url: "/logo-v2.png",
        width: 512,
        height: 512,
        alt: "Land of Fairy Tales Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Land of Fairy Tales — Build Confidence Through Stories That Feel Like Home",
    description:
      "Interactive reading adventures children love, rooted in culture, imagination, and confidence-building.",
    images: ["/logo-v2.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Schema Structured Data for SEO / AEO
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://www.landoffairytales.com/#organization",
    "name": "Land of Fairy Tales",
    "url": "https://www.landoffairytales.com",
    "logo": "https://www.landoffairytales.com/logo-v2.png",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "The East Wing - Parakuo link rd",
      "addressLocality": "Accra",
      "addressCountry": "GH"
    },
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "telephone": "+233-55-992-2299",
        "contactType": "customer support",
        "email": "hello@landoffairytales.com",
        "availableLanguage": "English"
      },
      {
        "@type": "ContactPoint",
        "telephone": "+44-7907-602402",
        "contactType": "customer support",
        "email": "hello@landoffairytales.com",
        "availableLanguage": "English"
      }
    ],
    "sameAs": [
      "https://www.facebook.com/Loftbookclub",
      "https://www.instagram.com/loftbookclub",
      "https://www.tiktok.com/@loftbookclub"
    ]
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": "https://www.landoffairytales.com/#product",
    "name": "Land of Fairy Tales Book Club Subscription",
    "image": "https://www.landoffairytales.com/logo-v2.png",
    "description": "Curated physical children books paired with interactive 3D digital guides and story-building play to foster reading habits.",
    "brand": {
      "@type": "Brand",
      "name": "Land of Fairy Tales"
    },
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "GHS",
      "lowPrice": "400",
      "highPrice": "1500",
      "offerCount": "3",
      "offers": [
        {
          "@type": "Offer",
          "name": "Starter Reader Plan",
          "price": "400",
          "priceCurrency": "GHS"
        },
        {
          "@type": "Offer",
          "name": "Growth Reader Plan",
          "price": "750",
          "priceCurrency": "GHS"
        },
        {
          "@type": "Offer",
          "name": "Omni Reader Plan",
          "price": "1500",
          "priceCurrency": "GHS"
        }
      ]
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Who are Land of Fairy Tales stories designed for?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our stories are created for children aged 2–10, but they can be enjoyed by anyone who loves a good bedtime story."
        }
      },
      {
        "@type": "Question",
        "name": "How do I access the stories?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Simply log in on your phone, tablet or computer and browse our library. Everything streams securely through our ad‑free platform, so there’s nothing to download."
        }
      },
      {
        "@type": "Question",
        "name": "Can I try Land of Fairy Tales before subscribing?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely — sign up today and receive five free bedtime stories. If you love them, you can unlock all 365 stories for a small monthly fee."
        }
      },
      {
        "@type": "Question",
        "name": "Are Land of Fairy Tales stories just entertainment or also educational?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "They’re both! Each tale we produce includes themes that build empathy, vocabulary and cultural awareness, so your child is learning while they listen."
        }
      },
      {
        "@type": "Question",
        "name": "How do I cancel my subscription?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You’re in control. You can upgrade, downgrade or cancel your membership at any time through your account settings, and you’ll still keep access to your free stories."
        }
      }
    ]
  };

  return (
    <html
      lang="en"
      className={`${quicksand.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-inter bg-brand-cream text-text-dark">
        {/* Schema Markup for Search and AI Answer Engines */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              organizationSchema,
              productSchema,
              faqSchema
            ])
          }}
        />
        {children}
      </body>
    </html>
  );
}
