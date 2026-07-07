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

// v1.5 §5.9: disclaimer = jedna sdílená konstanta, nahrazuje všechny
// lokální kopie (dvě ze tří v buildu neměly „ani krizovou pomoc").
// Až dorazí finální znění z GPT balíčku sekce 19, mění se JEN tady.
// v1.6 §7.17 DOSLOVA - jedna sdílená konstanta všude (footer, výklad,
// uložený výklad). Při jakékoli změně měň JEN tady.
export const DISCLAIMER =
  "Tarot o Lásce slouží k osobní reflexi, sebepoznání a zábavě. Výklady " +
  "nejsou odborným, psychologickým, zdravotním, právním ani finančním " +
  "poradenstvím a nenahrazují krizovou pomoc. V krizi kontaktuj Linku " +
  "první psychické pomoci: 116 123.";

// Cílová adresa mostu na SPIRIO (živé průvodkyně)
// v1.6 §8: všechny odkazy na landing spirio.cz (ne podstránky)
export const SPIRIO_URL = "https://spirio.cz";
