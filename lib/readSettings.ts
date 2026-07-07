// Runtime nastavení výkladu, přepínatelné z /dev/kredit (v1.6 dodatek).
// Uloženo v podepsané cookie (stejný princip jako ledger) - spolehlivé
// per-prohlížeč i na serverless, kde /tmp mezi instancemi nedrží.
// JEDINÉ nastavení zatím: povolit obrácené karty ve výkladu.
import crypto from "crypto";

const SECRET = process.env.SESSION_SECRET ?? "tol-mock-session-secret";
export const READ_SETTINGS_COOKIE = "tol_read_settings";

export type ReadSettings = {
  // true = karty mohou padnout i vzhůru nohama (výchozí chování 27 %)
  // false = všechny karty otočené normálně (obrácení se ignoruje)
  allowReversed: boolean;
};

export const DEFAULT_READ_SETTINGS: ReadSettings = { allowReversed: true };

function hmac(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function serializeReadSettings(s: ReadSettings): string {
  const payload = Buffer.from(JSON.stringify(s), "utf8").toString("base64url");
  return `${payload}.${hmac(payload)}`;
}

export function parseReadSettings(raw: string | undefined): ReadSettings {
  if (!raw) return DEFAULT_READ_SETTINGS;
  const [payload, sig] = raw.split(".");
  if (!payload || sig !== hmac(payload)) return DEFAULT_READ_SETTINGS;
  try {
    const obj = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return { allowReversed: obj.allowReversed !== false };
  } catch {
    return DEFAULT_READ_SETTINGS;
  }
}
