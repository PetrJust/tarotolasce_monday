import type { Config } from "tailwindcss";
import { tokens, palette, derived } from "./lib/palette";

// Design tokens v lib/palette.ts (v1.1 §C + v1.3 §1). Tenhle soubor je jen
// zapojení. Gradient a coral-400 zrušeny (v1.3 §1).
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // tokens v3 (v1.5 §3) - třídy drží zavedená jména kvůli rozsahu
        // migrace, hodnoty jedou z jediného zdroje lib/palette.ts
        plum: { 900: tokens.deepPlum, disabled: derived.ctaDisabled },
        blush: { 50: tokens.blush },
        powder: { 50: tokens.powderPink },
        rose: { 500: tokens.romanticPink, 700: derived.link },
        gold: { 600: tokens.softGold },
        night: palette.night,
        cream: palette.cream,
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      boxShadow: {
        card: "0 6px 24px rgba(43,19,64,0.18)",
        // v1.3 §1: primární CTA má velmi decentní stín, žádný glow
        cta: "0 2px 8px rgba(43,19,64,0.18)",
      },
      dropShadow: {
        card: "0 6px 12px rgba(43,19,64,0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
