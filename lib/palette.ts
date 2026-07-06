// JEDINÝ ZDROJ PRAVDY PRO BARVY - design tokens dle zadání v1.1 §C + v1.3 §1.
// Směr: světlá, hravá, láskyplná. Doladění hexů okem povoleno ±1 odstín;
// rose-500 doladěna z #E8489B na #EC5CA8, aby plum text na PLOCHÉ rose
// splnil WCAG AA (4.63:1; původní hex dával 4.05).
// rose-700 odvozena: #B81E76 (5.48:1 na blush, 6.03:1 na bílé).
// v1.3 §1: gradient ZRUŠEN v celé aplikaci, coral-400 zrušen (existoval jen
// jako koncový bod gradientu). Primární CTA = plná plum-900 s bílým textem
// (bílý text na CTA je jediná výjimka z pravidla „veškerý text plum-900").
export const tokens = {
  plum900: "#3B1D42", // veškerý text + pozadí primárního CTA - jediný zdroj pravdy
  blush50: "#FDF1F7", // pozadí stránek (plochá, žádný gradient pozadí)
  white: "#FFFFFF", // karty, boxy, inputy, text na primárním CTA
  rose500: "#EC5CA8", // akcent: sekundární akce, aktivní stavy, rámečky, ikony
  rose700: "#B81E76", // textové odkazy v běžné velikosti (AA na blush)
  gold600: "#B8912F", // jen mystické motivy (hvězdy, měsíce, ornamenty rubů)
  // Disabled primární CTA: šedo-švestková (plum-900 se sníženou sytostí),
  // bílý text 5.6:1 = AA (v1.3 §1).
  plumDisabled: "#6E5F72",
} as const;

// Noční fialová zůstává pro rub karet, Footer a krizovou obrazovku
// (mystické/ochranné plochy mimo hlavní světlé UI). Plochy jsou PLOCHÉ
// (invariant 3: žádný gradient).
export const palette = {
  night: { DEFAULT: "#2A1245", deep: "#1D0B33", soft: "#3D1B63", line: "#573085" },
  cream: { DEFAULT: "#FFF3EE", dim: "#E3C9CF" },
} as const;

// Procesní invariant 3 (v1.3 znění): „V aplikaci neexistuje žádný gradient.
// Primární CTA je plná plum-900 s bílým textem a každá obrazovka má právě
// jednu (mapa primárních akcí z v1.1 C platí)."

// Tmavý podklad pro Stories export a OG obrázek: PLOCHÁ noční fialová
// (samostatné exportované obrazy, ne UI plochy; gradient zrušen i tady).
export const NIGHT_FLAT = "#2A1245";

export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}, ${alpha})`;
}

/* ---------- WCAG kontrast (AA >= 4.5:1) ---------- */
function relLuminance(hex: string): number {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(h.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrastRatio(hexA: string, hexB: string): number {
  const [l1, l2] = [relLuminance(hexA), relLuminance(hexB)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}
export function meetsAA(textHex: string, bgHex: string): boolean {
  return contrastRatio(textHex, bgHex) >= 4.5;
}
