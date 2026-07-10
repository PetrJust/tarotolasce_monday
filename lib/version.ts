// Označení verze buildu pro /dev/kredit (žádost zakladatele, session 5).
// ZVEDNI PŘI KAŽDÉM PŘEDÁNÍ ZIPU: číslo + datum + jednořádkový popis.
// Git commit doplňuje Vercel automaticky (VERCEL_GIT_COMMIT_SHA přes
// /api/dev/env), tohle je lidsky čitelná řada nezávislá na gitu.
export const APP_VERSION = "v1.6.24";
export const APP_VERSION_DATE = "2026-07-06";
export const APP_VERSION_NOTE =
  "v1.6: Otočit kartu (jednotné číslo u 1 karty) + menší logo v hlavičce na mobilu";

// Verzování enginu pro analytiku (v1.5 §7: feedback_submitted nese
// prompt/model verzi; dashboard sleduje kvalitu per verze).
export const PROMPT_VERSION = "mock-flowb-1"; // dikce G, gramaticky bezpečné uvození
export const MODEL_VERSION = "mock-1"; // MOCK engine; v produkci ID modelu
