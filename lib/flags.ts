"use client";
// Feature flagy (zadání paleta §4 + backlog):
// Kreditní počítadlo a prodej balíčků jsou VYPNUTÉ v produkci, dokud
// nestojí server-side ledger vázaný na účet (P0). Pro TESTOVÁNÍ bez
// ledgeru jde flag dočasně zapnout jen v tvém prohlížeči přes /dev/kredit
// - nic to nemění na produkčním chování pro ostatní návštěvníky.
import { useEffect, useState } from "react";

// v1.1 §A: launch výhradně s funkčními balíčky -> defaultně zapnuto.
const ENV_DEFAULT = process.env.NEXT_PUBLIC_ENABLE_CREDITS !== "0";
const DEV_COOKIE = "tol_dev_credits"; // "1" zapnuto / "0" vypnuto / chybí = env výchozí

function readDevOverride(): boolean | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${DEV_COOKIE}=([^;]*)`));
  if (!m) return null;
  return decodeURIComponent(m[1]) === "1";
}

/** Použij v komponentách místo staré konstanty CREDITS_ENABLED.
 * SSR-safe: první render vrací env výchozí hodnotu (žádný hydration
 * mismatch), po mountu se případně přepne na lokální dev override. */
export function useCreditsEnabled(): boolean {
  const [enabled, setEnabled] = useState(ENV_DEFAULT);
  useEffect(() => {
    const dev = readDevOverride();
    if (dev !== null) setEnabled(dev);
  }, []);
  return enabled;
}

export function getDevCreditsOverride(): boolean | null {
  return readDevOverride();
}

export function setDevCreditsOverride(value: boolean | null) {
  if (value === null) {
    document.cookie = `${DEV_COOKIE}=; path=/; max-age=0`;
  } else {
    document.cookie = `${DEV_COOKIE}=${value ? "1" : "0"}; path=/; max-age=${365 * 86400}`;
  }
}

export const CREDITS_ENV_DEFAULT = ENV_DEFAULT;
