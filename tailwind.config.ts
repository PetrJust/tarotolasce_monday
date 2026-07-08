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
        // migrace. Hodnoty jedou přes CSS proměnné (:root v globals.css),
        // aby šly za běhu přepsat živým editorem v /dev/kredit. Fallback
        // za var() je původní hex z lib/palette.ts (kdyby var chyběla).
        plum: {
          900: `var(--tok-deep-plum, ${tokens.deepPlum})`,
          disabled: `var(--tok-cta-disabled, ${derived.ctaDisabled})`,
        },
        blush: { 50: `var(--tok-blush, ${tokens.blush})` },
        powder: { 50: `var(--tok-powder-pink, ${tokens.powderPink})` },
        rose: {
          500: `var(--tok-romantic-pink, ${tokens.romanticPink})`,
          700: `var(--tok-link, ${derived.link})`,
        },
        gold: { 600: `var(--tok-soft-gold, ${tokens.softGold})` },
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
