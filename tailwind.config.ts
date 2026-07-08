import type { Config } from "tailwindcss";
import { tokens, palette, loveGradient, hexToRgba } from "./lib/palette";

// Design tokens v lib/palette.ts (v1.1 §C). Tenhle soubor je jen zapojení.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        plum: { 900: tokens.plum900 },
        blush: { 50: tokens.blush50 },
        rose: { 500: tokens.rose500, 700: tokens.rose700 },
        coral: { 400: tokens.coral400 },
        gold: { 600: tokens.gold600 },
        night: palette.night,
        cream: palette.cream,
      },
      backgroundImage: {
        love: loveGradient(), // JEDINÝ gradient v aplikaci (invariant 3)
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      boxShadow: {
        card: "0 6px 24px rgba(59,29,66,0.18)",
        glow: `0 0 32px ${hexToRgba(tokens.rose500, 0.3)}`,
      },
      dropShadow: {
        card: "0 6px 12px rgba(59,29,66,0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
