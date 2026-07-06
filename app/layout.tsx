import type { Metadata } from "next";
import { Lora, Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import { PERSONA_NAME, PERSONA_FULL } from "@/lib/persona";

// v1.3 §2: nadpisy H1/H2/H3 = Lora (nahrazuje Fraunces), tělo a UI = Inter.
// latin-ext kvůli české diakritice, font-display: swap. Všechna typografická
// pravidla z v1.1 D platí s Lorou.
const display = Lora({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-display",
});
const sans = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-sans",
});
// Logo: jediná povolená výjimka. Současný řez (Fraunces 600) zůstává,
// dokud zakladatel pohledem nerozhodne Fraunces vs. Lora 600 (v1.3 §2).
// Po rozhodnutí pro Loru: smazat tenhle import a v Headeru dát font-display.
const logo = Fraunces({
  subsets: ["latin", "latin-ext"],
  weight: ["600"],
  display: "swap",
  variable: "--font-logo",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Tarot o Lásce: AI tarotové výklady o lásce a vztazích",
    template: "%s | Tarot o Lásce",
  },
  description:
    `Polož otázku, vyber si karty a dostaň osobní tarotový výklad o lásce od AI kartářky ${PERSONA_NAME}. První výklad za 29 Kč.`,
  openGraph: {
    siteName: "Tarot o Lásce",
    locale: "cs_CZ",
    type: "website",
    description:
      `Osobní tarotové výklady o lásce od AI kartářky ${PERSONA_NAME}. První výklad za 29 Kč, karta dne zdarma.`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Tarot o Lásce: AI tarotové výklady o lásce",
    description:
      `Osobní tarotové výklady o lásce od AI kartářky ${PERSONA_NAME}. První výklad za 29 Kč.`,
  },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Tarot o Lásce",
  url: SITE_URL,
  description:
    `Česká aplikace pro AI tarotové výklady zaměřené na lásku a vztahy. Všechny výklady vytváří ${PERSONA_FULL}.`,
};

const webSiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Tarot o Lásce",
  url: SITE_URL,
  inLanguage: "cs",
  description:
    `Osobní tarotové výklady o lásce od AI kartářky ${PERSONA_NAME}.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" className={`${display.variable} ${sans.variable} ${logo.variable}`}>
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
