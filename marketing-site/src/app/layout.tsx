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
        "name": "What is Land of Fairy Tales?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Land of Fairy Tales is a personalized, interactive book club for families. We curate premium physical books and pair them with digital/interactive audio guides and story-building play to foster a lifelong love of reading."
        }
      },
      {
        "@type": "Question",
        "name": "What age groups is Land of Fairy Tales designed for?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We offer curated tracks for children aged 3 to 12. Each box is tailored to your child's reading level and developmental stage."
        }
      },
      {
        "@type": "Question",
        "name": "How does the personalization work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "When you sign up, you'll share your child's interests, reading habits, and milestones. Our educators and creators customize the experience—including personalized birthday book keepsakes—to make them feel like the hero of their reading journey."
        }
      },
      {
        "@type": "Question",
        "name": "Can I pause or cancel my subscription?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, absolutely! You can pause, adjust, or cancel your subscription at any time directly from your family portal, with no commitments or hidden fees."
        }
      },
      {
        "@type": "Question",
        "name": "How are the books selected?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We partner with leading children's publishers and independent authors to find stories that spark curiosity, build empathy, and represent diverse worlds and perspectives."
        }
      },
      {
        "@type": "Question",
        "name": "Do you ship internationally?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! We ship from our locations in Accra, Ghana, and partner hubs across the UK and internationally to reach story lovers worldwide."
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
