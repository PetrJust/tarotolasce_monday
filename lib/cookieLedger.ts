// MOCK kreditní ledger v PODEPSANÉ COOKIE (hotfix serverless split-brain).
//
// PŮVODNÍ PROBLÉM: ledger ležel v souboru v /tmp konkrétní serverless
// instance. Nákup balíčku se zapsal na instanci A, ale /api/credits o
// chvíli později obsloužila instance B s prázdným /tmp -> zůstatek 0,
// aplikace nabízela nákup i s koupenými kredity.
//
// ŘEŠENÍ PRO MOCK: stav (zůstatek, idempotenční refy, využité intro)
// cestuje v HMAC-podepsané httpOnly cookie s prohlížečem - každá instance
// ho vidí stejně. Podpis brání ruční úpravě hodnoty.
//
// VĚDOMÉ LIMITY MOCKU (řeší až PostgreSQL, schema.sql):
//  - kredit je vázaný na prohlížeč+e-mail, ne čistě na účet napříč
//    zařízeními (test A.3 platí pro lib/account, produkce = DB),
//  - smazání cookies = smazání mock zůstatku.
// Invarianty zachované i tady: idempotence připsání podle paymentIntentId,
// idempotence čerpání podle sessionId, čerpání odmítnuté při zůstatku 0,
// intro jen jednou (na tenhle prohlížeč+e-mail).
import crypto from "crypto";

const SECRET = process.env.SESSION_SECRET ?? "tol-mock-session-secret";
export const LEDGER_COOKIE = "tol_ledger";
const MAX_REFS = 40; // poslední refy pro idempotenci; starší ořežeme

export type CookieLedger = {
  email: string; // ledger je vázaný na e-mail účtu
  balance: number;
  refs: string[]; // "pi:<id>" nákupy, "use:<sessionId>" čerpání
  introUsed: boolean;
};

const hmac = (s: string) =>
  crypto.createHmac("sha256", SECRET).update(s).digest("base64url");

export function emptyLedger(email: string): CookieLedger {
  return { email: email.trim().toLowerCase(), balance: 0, refs: [], introUsed: false };
}

export function serializeLedger(l: CookieLedger): string {
  const payload = Buffer.from(JSON.stringify(l), "utf8").toString("base64url");
  return `${payload}.${hmac(payload)}`;
}

export function parseLedger(cookieVal: string | undefined | null, email: string): CookieLedger {
  const fresh = emptyLedger(email);
  if (!cookieVal) return fresh;
  const dot = cookieVal.lastIndexOf(".");
  if (dot < 0) return fresh;
  const payload = cookieVal.slice(0, dot);
  const sig = cookieVal.slice(dot + 1);
  const expected = hmac(payload);
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return fresh;
  }
  try {
    const l = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as CookieLedger;
    if (
      typeof l !== "object" || l === null ||
      typeof l.balance !== "number" || !Array.isArray(l.refs) ||
      typeof l.email !== "string"
    ) {
      return fresh;
    }
    // Ledger patří jinému e-mailu (přihlásila se jiná adresa) -> čistý start
    if (l.email !== fresh.email) return fresh;
    return { ...l, refs: l.refs.slice(0, MAX_REFS), introUsed: !!l.introUsed };
  } catch {
    return fresh;
  }
}

/** Idempotentní připsání kreditu (jako webhook - smí přijít vícekrát). */
export function ledgerCredit(l: CookieLedger, credits: number, paymentIntentId: string): CookieLedger {
  const ref = `pi:${paymentIntentId}`;
  if (l.refs.includes(ref)) return l; // duplicitní webhook -> beze změny
  return { ...l, balance: l.balance + credits, refs: [ref, ...l.refs].slice(0, MAX_REFS) };
}

/** Idempotentní čerpání podle sessionId; odmítá při zůstatku 0. */
export function ledgerConsume(
  l: CookieLedger,
  sessionId: string
): { ok: boolean; ledger: CookieLedger } {
  const ref = `use:${sessionId}`;
  if (l.refs.includes(ref)) return { ok: true, ledger: l }; // už strženo (refresh)
  if (l.balance < 1) return { ok: false, ledger: l };
  return {
    ok: true,
    ledger: { ...l, balance: l.balance - 1, refs: [ref, ...l.refs].slice(0, MAX_REFS) },
  };
}

/** Atributy cookie: httpOnly (čte jen server), podpis brání úpravě. */
export function ledgerCookieAttrs() {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 365 * 86400,
  };
}

/** Ruční Set-Cookie hlavička (pro streaming Response, kde nejde cookies()). */
export function ledgerSetCookieHeader(l: CookieLedger): string {
  const a = ledgerCookieAttrs();
  return [
    `${LEDGER_COOKIE}=${serializeLedger(l)}`,
    `Path=${a.path}`,
    `Max-Age=${a.maxAge}`,
    "HttpOnly",
    "SameSite=Lax",
    a.secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}
