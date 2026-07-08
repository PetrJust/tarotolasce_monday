// JEDINÝ ZDROJ PRAVDY PRO BARVY - design tokens dle zadání v1.1 §C.
// Směr: světlá, hravá, láskyplná. Doladění hexů okem povoleno ±1 odstín;
// rose-500 doladěna z #E8489B na #EC5CA8, aby plum text na PLOCHÉ rose
// splnil WCAG AA (4.63:1; původní hex dával 4.05). Gradient s plum textem:
// 4.63 (rose stop) / 6.50 (coral stop) - AA na obou koncích.
// rose-700 odvozena: #B81E76 (5.48:1 na blush, 6.03:1 na bílé).
export const tokens = {
  plum900: "#3B1D42", // veškerý text včetně textu na CTA - jediná barva textu
  blush50: "#FDF1F7", // pozadí stránek (plochá, žádný gradient pozadí)
  white: "#FFFFFF", // karty, boxy, inputy
  rose500: "#EC5CA8", // akcent: aktivní stavy, rámečky, ikony, ploché CTA
  rose700: "#B81E76", // textové odkazy v běžné velikosti (AA na blush)
  coral400: "#FF8E72", // VÝHRADNĚ koncový bod gradientu
  gold600: "#B8912F", // jen mystické motivy (hvězdy, měsíce, ornamenty rubů)
} as const;

// Noční fialová zůstává pro rub karet, Footer a krizovou obrazovku
// (mystické/ochranné plochy mimo hlavní světlé UI).
export const palette = {
  night: { DEFAULT: "#2A1245", deep: "#1D0B33", soft: "#3D1B63", line: "#573085" },
  cream: { DEFAULT: "#FFF3EE", dim: "#E3C9CF" },
} as const;

// Procesní invariant 3: v aplikaci existuje JEDINÝ gradient - tento.
// Povolen pouze na primárním CTA (právě jedno na obrazovku, mapa v §C)
// a jednom dekorativním prvku hero. Každé další gradientní místo je chyba.
export const GRADIENT_STOPS = [tokens.rose500, tokens.coral400] as const;
export function loveGradient(angle = 45): string {
  return `linear-gradient(${angle}deg, ${GRADIENT_STOPS[0]} 0%, ${GRADIENT_STOPS[1]} 100%)`;
}

// Tmavý podklad pro Stories export a OG obrázek (samostatné exportované
// obrazy karet, ne UI plochy - mystický motiv, gold ornamentika povolena).
export const NIGHT_GRADIENT = ["#1D0B33", "#2A1245", "#4A2070"] as const;

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
