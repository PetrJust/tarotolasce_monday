// Základní URL webu. V produkci nastav NEXT_PUBLIC_SITE_URL v prostředí,
// např. NEXT_PUBLIC_SITE_URL=https://tarotolasce.cz
// Lokálně se použije produkční doména jako výchozí.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://tarotolasce.cz";

// Provozovatel a kontakt (v1 §12): konfigurační hodnoty, ne {TODO} v kódu.
export const OPERATOR =
  process.env.NEXT_PUBLIC_OPERATOR ?? "SpirioTech s.r.o.";
export const OPERATOR_ICO = process.env.NEXT_PUBLIC_OPERATOR_ICO ?? ""; // doplň IČO v env
export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "ahoj@tarotolasce.cz";
