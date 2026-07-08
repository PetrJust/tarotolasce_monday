#!/usr/bin/env node
// ---------------------------------------------------------------------------
//  Převod obrázků tarotových karet na sjednocené WebP do public/cards/
//
//  CO DĚLÁ:
//   - vezme originály z libovolné složky (jakýkoli rozměr, JPG/PNG/WebP)
//   - vyrobí z každé karty 600×960 WebP (poměr 1:1.6), vycentrované,
//     doplněné do rámu (barva pozadí je nastavitelná), kvalita 82
//   - pojmenuje výstup PŘESNĚ podle id karty (blazen.webp, mag.webp, …),
//     takže je appka rovnou najde (CardFace načítá /cards/{id}.webp)
//   - na konci vypíše, které z 78 karet chybí nebo přebývají
//
//  JAK PÁROVAT VSTUP S KARTAMI (dvě možnosti, stačí jedna):
//   A) Pojmenuj vstupní soubory rovnou id karty: blazen.jpg, mag.png, …
//      (id najdeš ve scripts/card-ids.json). NEJSPOLEHLIVĚJŠÍ.
//   B) Dej do vstupní složky soubor mapa.json ve tvaru
//      { "muj-soubor-01.jpg": "blazen", "IMG_2231.png": "mag", … }
//      (klíč = název souboru, hodnota = id karty).
//
//  POUŽITÍ:
//   node scripts/prevod-karet.mjs <vstupni_slozka> [--bg "#2B1340"] [--back]
//
//   --bg   barva výplně za kartou (default průhledná; pro JPG dej #2B1340)
//   --back když je mezi vstupy soubor s id "back", vyrobí i /cards/back.webp
//
//  ZÁVISLOST: sharp.  Když chybí:  npm i -D sharp
// ---------------------------------------------------------------------------

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "cards");

// --- cílové rozměry (poměr 1 : 1.6, viz analýza zobrazení v appce) ---
const W = 600;
const H = 960;
const QUALITY = 82;

// --- načtení sharp (s jasnou hláškou, když chybí) ---
let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.error(
    "\n✗ Chybí balíček 'sharp'. Nainstaluj ho:\n    npm i -D sharp\n" +
      "  (pak spusť skript znovu).\n"
  );
  process.exit(1);
}

// --- argumenty ---
const args = process.argv.slice(2);
if (!args[0] || args[0].startsWith("--")) {
  console.error(
    "Použití: node scripts/prevod-karet.mjs <vstupni_slozka> [--bg \"#2B1340\"] [--back]"
  );
  process.exit(1);
}
const SRC_DIR = path.resolve(args[0]);
const bgIdx = args.indexOf("--bg");
const BG = bgIdx !== -1 ? args[bgIdx + 1] : null; // null = průhledné
const DO_BACK = args.includes("--back");

if (!fs.existsSync(SRC_DIR)) {
  console.error(`✗ Vstupní složka neexistuje: ${SRC_DIR}`);
  process.exit(1);
}

// --- seznam očekávaných karet ---
const cardsManifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, "card-ids.json"), "utf8")
);
const validIds = new Set(cardsManifest.map((c) => c.id));

// --- volitelná mapa.json ve vstupní složce ---
let nameMap = {};
const mapPath = path.join(SRC_DIR, "mapa.json");
if (fs.existsSync(mapPath)) {
  try {
    nameMap = JSON.parse(fs.readFileSync(mapPath, "utf8"));
    console.log(`• Načtena mapa.json (${Object.keys(nameMap).length} položek)`);
  } catch {
    console.error("✗ mapa.json je poškozená (není to platný JSON) - ignoruji.");
  }
}

// --- pomocná: z názvu souboru odvoď id karty ---
function resolveId(filename) {
  // 1) explicitní mapa
  if (nameMap[filename]) return nameMap[filename];
  // 2) název souboru bez přípony = id
  const base = filename.replace(/\.[^.]+$/, "").trim().toLowerCase();
  if (validIds.has(base)) return base;
  // 3) povol drobné varianty (mezery/podtržítka -> pomlčky)
  const norm = base.replace(/[ _]+/g, "-");
  if (validIds.has(norm)) return norm;
  return null;
}

const IMG_RE = /\.(jpe?g|png|webp|tiff?|avif)$/i;
const files = fs
  .readdirSync(SRC_DIR)
  .filter((f) => IMG_RE.test(f) && fs.statSync(path.join(SRC_DIR, f)).isFile());

if (!files.length) {
  console.error(`✗ Ve složce nejsou žádné obrázky: ${SRC_DIR}`);
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const done = new Set();
const unmatched = [];
let bytesIn = 0;
let bytesOut = 0;

console.log(
  `\nPřevádím ${files.length} souborů → ${W}×${H} WebP (kvalita ${QUALITY})` +
    (BG ? `, pozadí ${BG}` : ", průhledné pozadí") +
    `\nCíl: ${path.relative(ROOT, OUT_DIR)}/\n`
);

for (const file of files) {
  const id = resolveId(file);
  if (!id) {
    unmatched.push(file);
    continue;
  }
  if (id === "back" && !DO_BACK) {
    // rub necháme jen když je vyžádaný přepínačem --back
    unmatched.push(`${file} (rub - přidej --back, pokud ho chceš)`);
    continue;
  }
  if (id !== "back" && !validIds.has(id)) {
    unmatched.push(`${file} (id "${id}" není mezi 78 kartami)`);
    continue;
  }

  const inPath = path.join(SRC_DIR, file);
  const outPath = path.join(OUT_DIR, `${id}.webp`);
  try {
    const inputStat = fs.statSync(inPath);
    bytesIn += inputStat.size;

    // "cover" ořízne na přesný poměr; "contain" doplní okraji. Volíme
    // contain + pozadí, ať se neuřízne okraj karty. Kdo chce vyplnit celý
    // rám bez okrajů, může si přepnout fit na "cover".
    const pipeline = sharp(inPath).resize(W, H, {
      fit: "contain",
      background: BG ? BG : { r: 0, g: 0, b: 0, alpha: 0 },
    });

    await pipeline
      .webp({ quality: QUALITY, effort: 6 })
      .toFile(outPath);

    bytesOut += fs.statSync(outPath).size;
    done.add(id);
    process.stdout.write(`  ✓ ${file}  →  ${id}.webp\n`);
  } catch (e) {
    console.error(`  ✗ ${file}: ${e.message}`);
    unmatched.push(`${file} (chyba převodu)`);
  }
}

// --- souhrn ---
const missing = cardsManifest.filter((c) => !done.has(c.id));

console.log("\n" + "─".repeat(52));
console.log(`Hotovo: ${done.size} karet převedeno`);
if (bytesIn > 0) {
  const mb = (n) => (n / 1048576).toFixed(2);
  console.log(
    `Velikost: ${mb(bytesIn)} MB  →  ${mb(bytesOut)} MB` +
      (bytesIn ? `  (−${Math.round((1 - bytesOut / bytesIn) * 100)} %)` : "")
  );
}

if (unmatched.length) {
  console.log(`\n⚠ Nespárováno (${unmatched.length}):`);
  unmatched.forEach((u) => console.log(`   • ${u}`));
  console.log(
    "   → pojmenuj soubory podle id karty, nebo přidej mapa.json " +
      "(viz hlavička skriptu). Seznam id: scripts/card-ids.json"
  );
}

if (missing.length) {
  console.log(`\n⚠ Chybí ${missing.length} z 78 karet:`);
  console.log("   " + missing.map((c) => c.id).join(", "));
} else {
  console.log("\n✓ Všech 78 karet je hotovo.");
  if (DO_BACK && done.has("back")) console.log("✓ Rub karty (back.webp) také.");
}
console.log("─".repeat(52) + "\n");
