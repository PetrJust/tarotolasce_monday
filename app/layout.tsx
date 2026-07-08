import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";

const display = Fraunces({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600"],
  display: "swap",
  variable: "--font-display",
});
const sans = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Tarot o Lásce: AI tarotové výklady o lásce a vztazích",
    template: "%s | Tarot o Lásce",
  },
  description:
    "Polož otázku, vyber si karty a dostaň osobní tarotový výklad o lásce od AI kartářky Nomi. První výklad za 29 Kč.",
  openGraph: {
    siteName: "Tarot o Lásce",
    locale: "cs_CZ",
    type: "website",
    description:
      "Osobní tarotové výklady o lásce od AI kartářky Nomi. První výklad za 29 Kč, karta dne zdarma.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tarot o Lásce: AI tarotové výklady o lásce",
    description:
      "Osobní tarotové výklady o lásce od AI kartářky Nomi. První výklad za 29 Kč.",
  },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Tarot o Lásce",
  url: SITE_URL,
  description:
    "Česká aplikace pro AI tarotové výklady zaměřené na lásku a vztahy. Všechny výklady vytváří AI kartářka Nomi.",
};

const webSiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Tarot o Lásce",
  url: SITE_URL,
  inLanguage: "cs",
  description:
    "Osobní tarotové výklady o lásce od AI kartářky Nomi.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
        />
        <Header />
        <main className="mx-auto w-full max-w-3xl px-4 pb-24">{children}</main>
        <Footer />
        <CookieBanner />
      </body>
    </html>
  );
}
