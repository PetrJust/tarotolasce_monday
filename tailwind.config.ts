import type { Config } from "tailwindcss";
import { tokens, palette } from "./lib/palette";

// Design tokens v lib/palette.ts (v1.1 §C + v1.3 §1). Tenhle soubor je jen
// zapojení. Gradient a coral-400 zrušeny (v1.3 §1).
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        plum: { 900: tokens.plum900, disabled: tokens.plumDisabled },
        blush: { 50: tokens.blush50 },
        rose: { 500: tokens.rose500, 700: tokens.rose700 },
        gold: { 600: tokens.gold600 },
        night: palette.night,
        cream: palette.cream,
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        // Logo: jediná povolená výjimka - současný řez (Fraunces) vs.
        // Lora 600 rozhodne zakladatel pohledem (v1.3 §2).
        logo: ["var(--font-logo)", "serif"],
      },
      boxShadow: {
        card: "0 6px 24px rgba(59,29,66,0.18)",
        // v1.3 §1: primární CTA má velmi decentní stín, žádný glow
        cta: "0 2px 8px rgba(59,29,66,0.18)",
      },
      dropShadow: {
        card: "0 6px 12px rgba(59,29,66,0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
