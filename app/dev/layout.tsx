import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Dev",
  robots: { index: false, follow: false },
};

// v1.3 §5: gate přes VERCEL_ENV - na preview jsou dev nástroje zapnuté
// automaticky, na produkci NEEXISTUJÍ (404), pokud je vědomě neodemkne
// ALLOW_DEV_TOOLS=1 (dočasný přepínač pro zakladatele, např. otestovat
// nákup kreditu přímo na produkční doméně). Lokálně (bez VERCEL_ENV)
// zapnuto vždy. DŮLEŽITÉ: po otestování ALLOW_DEV_TOOLS na produkci zase
// smaž - deploy-check hlídá jen TEST_OTP_CODE/OTP_DEV_PREVIEW, tenhle
// přepínač je vědomá výjimka mimo jeho rozsah.
export default function Layout({ children }: { children: React.ReactNode }) {
  const isProd = process.env.VERCEL_ENV === "production";
  const unlocked = process.env.ALLOW_DEV_TOOLS === "1";
  if (isProd && !unlocked) {
    notFound();
  }
  return children;
}
