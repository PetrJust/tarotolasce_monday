// Automatický check při deployi (v1.3 §5, upraveno pro vědomou výjimku
// ALLOW_DEV_TOOLS). Na PRODUKCI nesmí BEZ VÝSLOVNÉHO ODEMKNUTÍ existovat
// TEST_OTP_CODE ani přístupné /dev/* nástroje. Spouští se před next build
// (package.json "build"). Selhání = build spadne, nic se nenasadí.
//
// Co hlídá:
// 1. VERCEL_ENV === "production" && TEST_OTP_CODE nastavené
//    && ALLOW_DEV_TOOLS !== "1" -> FAIL
// 2. VERCEL_ENV === "production" && OTP_DEV_PREVIEW === "1"
//    && ALLOW_DEV_TOOLS !== "1" -> FAIL
// 3. app/dev/layout.tsx musí obsahovat produkční notFound() gate -> jinak FAIL
//    (ochrana proti omylem smazanému gate; runtime gate je v layoutu samém)
//
// ALLOW_DEV_TOOLS=1 je vědomá, dočasná výjimka zakladatele (např. otestovat
// nákup kreditu přímo na produkční doméně) - build s ní neshodí, ale při
// každém deployi vypíše hlasité varování, ať se na ni nezapomene.

import { readFileSync } from "node:fs";

const isProd = process.env.VERCEL_ENV === "production";
const devUnlocked = process.env.ALLOW_DEV_TOOLS === "1";
const errors = [];
const warnings = [];

if (isProd && process.env.TEST_OTP_CODE) {
  if (devUnlocked) {
    warnings.push("TEST_OTP_CODE je na produkci aktivní (ALLOW_DEV_TOOLS=1 to vědomě povoluje). Po testování obě proměnné smaž.");
  } else {
    errors.push("TEST_OTP_CODE je nastavené na produkci bez ALLOW_DEV_TOOLS=1 - smaž env proměnnou.");
  }
}
if (isProd && process.env.OTP_DEV_PREVIEW === "1") {
  if (devUnlocked) {
    warnings.push("OTP_DEV_PREVIEW=1 je na produkci aktivní (ALLOW_DEV_TOOLS=1 to vědomě povoluje). Po testování obě proměnné smaž.");
  } else {
    errors.push("OTP_DEV_PREVIEW=1 na produkci bez ALLOW_DEV_TOOLS=1 - smaž env proměnnou.");
  }
}
if (isProd && devUnlocked) {
  warnings.push("ALLOW_DEV_TOOLS=1 je na produkci aktivní - /dev/* je teď VEŘEJNĚ dostupné. Po testování smaž.");
}

const devLayout = readFileSync(new URL("../app/dev/layout.tsx", import.meta.url), "utf8");
if (!devLayout.includes('process.env.VERCEL_ENV === "production"') || !devLayout.includes("notFound()")) {
  errors.push("app/dev/layout.tsx ztratil produkční notFound() gate (v1.3 §5).");
}

if (errors.length) {
  console.error("\n✗ Deploy check (v1.3 §5) NEPROŠEL:\n");
  for (const e of errors) console.error("  - " + e);
  console.error("");
  process.exit(1);
}
if (warnings.length) {
  console.warn("\n⚠ Deploy check (v1.3 §5): build pokračuje, ale POZOR:\n");
  for (const w of warnings) console.warn("  - " + w);
  console.warn("");
} else {
  console.log("✓ Deploy check (v1.3 §5): TEST_OTP_CODE ani /dev/* na produkci neexistují.");
}
