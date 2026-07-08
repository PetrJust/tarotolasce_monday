// Historie výkladů v podepsané cookie (interim řešení do PostgreSQL).
// DŮVOD: soubor/paměťový store v lib/store.ts je na Vercelu per-instance
// a ephemerní (/tmp, .data read-only) - výklad uložený na instanci A pak
// jiná instance při otevření detailu nenajde → 404 „Tahle karta v balíčku
// není". Stejný split-brain jako u kreditu; řešíme stejným vzorem jako
// ledger/session: podepsaná cookie per prohlížeč.
//
// Do cookie ukládáme jen KOMPAKTNÍ záznam (otázka, karty, typ, jméno,
// čas) - NE plný text. Text výkladu je z mock enginu deterministický,
// takže se v detailu spolehlivě zregeneruje z týchž vstupů. Tím cookie
// zůstává malá (limit ~4 KB) i po více výkladech (držíme posledních N).
import crypto from "crypto";

const SECRET = process.env.SESSION_SECRET ?? "tol-mock-session-secret";
export const READINGS_COOKIE = "tol_readings";
const MAX_ITEMS = 20; // posledních 20 výkladů (cookie limit)

export type CookieReadingCard = {
  cardId: string;
  name: string;
  reversed: boolean;
  position: string;
};

export type CookieReading = {
  id: string;
  question: string;
  spreadKey: string;
  spreadName: string;
  name: string; // jméno z profilu v době výkladu (pro regeneraci textu)
  cards: CookieReadingCard[];
  createdAt: number;
};

function hmac(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function serializeReadings(list: CookieReading[]): string {
  const trimmed = list.slice(0, MAX_ITEMS);
  const payload = Buffer.from(JSON.stringify(trimmed), "utf8").toString("base64url");
  return `${payload}.${hmac(payload)}`;
}

export function parseReadings(raw: string | undefined): CookieReading[] {
  if (!raw) return [];
  const [payload, sig] = raw.split(".");
  if (!payload || sig !== hmac(payload)) return [];
  try {
    const arr = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Array.isArray(arr) ? (arr as CookieReading[]) : [];
  } catch {
    return [];
  }
}

// Přidá nový výklad na začátek a vrátí novou serializovanou cookie hodnotu.
export function addReading(
  raw: string | undefined,
  reading: CookieReading
): string {
  const list = parseReadings(raw);
  // idempotence na id (dvojí zápis téhož výkladu neduplikuje)
  const without = list.filter((r) => r.id !== reading.id);
  return serializeReadings([reading, ...without]);
}

export function findReading(
  raw: string | undefined,
  id: string
): CookieReading | undefined {
  return parseReadings(raw).find((r) => r.id === id);
}

// Sestaví Set-Cookie hlavičku pro historii (stejný tvar jako ledger).
export function serializeSetCookie(name: string, value: string): string {
  const secure = process.env.NODE_ENV === "production";
  return [
    `${name}=${value}`,
    "Path=/",
    `Max-Age=${365 * 86400}`,
    "HttpOnly",
    "SameSite=Lax",
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}
