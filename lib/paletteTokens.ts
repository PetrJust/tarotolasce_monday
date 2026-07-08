// Editovatelné barevné tokeny (živý editor v /dev/kredit).
// Každý token = jedna CSS proměnná na :root. Editor je přepisuje přes
// document.documentElement.style.setProperty a ukládá do localStorage;
// Tailwind i .btn-primary z týchž proměnných čtou, takže změna se projeví
// v celé appce. Klíč (cssVar) MUSÍ odpovídat proměnným v globals.css.
export type PaletteToken = {
  key: string; // stabilní id do úložiště
  cssVar: string; // název CSS proměnné (--tok-…)
  label: string; // popisek v editoru
  hint: string; // kde se v appce projeví
  default: string; // výchozí hex (tokens v3)
};

export const PALETTE_TOKENS: PaletteToken[] = [
  { key: "deepPlum", cssVar: "--tok-deep-plum", label: "Deep-plum", hint: "text, primární tlačítka, rub karet", default: "#2B1340" },
  { key: "romanticPink", cssVar: "--tok-romantic-pink", label: "Romantic-pink", hint: "akcenty, srdce, aktivní stavy", default: "#E84D9A" },
  { key: "blush", cssVar: "--tok-blush", label: "Blush", hint: "pozadí stránek", default: "#F7E6EC" },
  { key: "powderPink", cssVar: "--tok-powder-pink", label: "Powder-pink", hint: "boxy a karty", default: "#FBEAF2" },
  { key: "softGold", cssVar: "--tok-soft-gold", label: "Soft-gold", hint: "mystické motivy (hvězdy, rám)", default: "#D4AF37" },
  { key: "link", cssVar: "--tok-link", label: "Odkazy", hint: "textové odkazy (tmavší pink)", default: "#A2366C" },
  { key: "accentDim", cssVar: "--tok-accent-dim", label: "Accent-dim", hint: "jemné rámečky, lem srdce", default: "#F6BBD9" },
  { key: "textDim", cssVar: "--tok-text-dim", label: "Ztlumený text", hint: "sekundární text", default: "#5E486B" },
  { key: "ctaDisabled", cssVar: "--tok-cta-disabled", label: "Neaktivní CTA", hint: "vypnuté tlačítko", default: "#574566" },
  { key: "surfaceBorder", cssVar: "--tok-surface-border", label: "Okraj plochy", hint: "okraje boxů a inputů", default: "#F7C7DF" },
];

export const PALETTE_STORAGE_KEY = "tol_palette_overrides_v1";

export type PaletteOverrides = Record<string, string>;

// Aplikuje overridy na :root (jen v prohlížeči). Odolné vůči nevalidním
// hodnotám - přeskočí cokoli, co není #RRGGBB, a nikdy nehodí výjimku.
export function applyPaletteOverrides(ov: PaletteOverrides) {
  if (typeof document === "undefined") return;
  try {
    const root = document.documentElement;
    const valid = (v: unknown): v is string =>
      typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);
    for (const t of PALETTE_TOKENS) {
      const v = ov?.[t.key];
      if (valid(v)) root.style.setProperty(t.cssVar, v);
      else root.style.removeProperty(t.cssVar);
    }
  } catch {
    /* nikdy nesmí shodit stránku */
  }
}

export function loadPaletteOverrides(): PaletteOverrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PALETTE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    // ponech jen validní #RRGGBB hodnoty
    const clean: PaletteOverrides = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v)) clean[k] = v;
    }
    return clean;
  } catch {
    return {};
  }
}

export function savePaletteOverrides(ov: PaletteOverrides) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PALETTE_STORAGE_KEY, JSON.stringify(ov));
  } catch {
    /* ignore */
  }
}
