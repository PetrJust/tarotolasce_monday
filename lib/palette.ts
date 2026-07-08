// JEDINÝ ZDROJ PRAVDY PRO BARVY - tokens v3 dle zadání v1.5 §3.
// Paleta se mění pouze se změnou loga (invariant 3). Jediný zdroj pro UI,
// SVG, Stories, OG i e-maily. Čtveřice starých hex hodnot z v1-v1.3 je
// zakázaná a z repa odstraněná (launch checklist grep drží čistý).
export const tokens = {
  deepPlum: "#2B1340", // veškerý text; pozadí primárního CTA
  romanticPink: "#E84D9A", // akcenty, ikony, rámečky, aktivní stavy
  blush: "#F7E6EC", // pozadí stránek
  powderPink: "#FBEAF2", // karty/boxy - kontrast OVĚŘEN: deep-plum 14,3:1, text-dim 6,9:1 (AA), fallback bílá netřeba
  softGold: "#D4AF37", // JEN mystické motivy; nikdy text/tlačítko
  white: "#FFFFFF", // text na CTA; podklady
} as const;

// Kontrastně ověřené ODVOZENINY tokens v3 (nejsou nové barvy, jen
// vypočtené odstíny pro AA - zděděná kontrastní pravidla §3):
export const derived = {
  // textové odkazy v běžné velikosti: tmavší romantic-pink, 5,3:1 na blush
  link: "#A2366C",
  // sekundární text: zesvětlená deep-plum, 6,7:1 na blush / 6,9:1 na powder
  textDim: "#5E486B",
  // rámečky/akcentní linky: zesvětlená romantic-pink
  accentDim: "#F6BBD9",
  surfaceBorder: "#F7C7DF",
  // disabled primární CTA: odsycená deep-plum, bílý text 8,6:1
  ctaDisabled: "#574566",
} as const;

// Noční plochy (rub karet, Footer, krizová obrazovka) = odvozeniny
// deep-plum (tokens v3), plocha vždy PLOCHÁ - žádný gradient (invariant 1).
export const palette = {
  night: {
    DEFAULT: tokens.deepPlum,
    deep: "#1E0D2D",
    soft: "#442F57",
    line: "#6B5A79",
  },
  // světlý text na nočních plochách = blush + její ztlumení
  cream: { DEFAULT: tokens.blush, dim: "#CBB2C4" },
} as const;

// Zpětně kompatibilní aliasy (ať jednorázová migrace nerozbije importy);
// nové použití vždy přes tokens/derived výše.
export const NIGHT_FLAT = palette.night.DEFAULT;

export function hexToRgba(hex: string, alpha: number): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
