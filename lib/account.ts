// MOCK: replace with production (PostgreSQL, tabulky viz schema.sql)
// Účty, ledger, OTP a sessions dle zadání v1 §4 + v1.1 §A/§B.
// Soubor .data/account.json + in-process mutex = transakční chování pro
// mock. Invarianty (vynucené tady, testované v tests/ledger.test.ts):
//  - ledger je append-only, zůstatek = SUM(delta), nikdy přepis
//  - připsání kreditu idempotentní podle paymentIntentId (unikátní ref)
//  - čerpání odmítá server při zůstatku 0 (ne jen frontend)
//  - intro cena jen jednou na účet (server-side)
//  - OTP: hash kódu, TTL 10 min, jednorázovost, nový invaliduje starý,
//    max 5 pokusů -> zámek 15 min, resend po 60 s, rate limit 5/hod
//    na adresu a 15/hod na IP, identická odpověď pro ne/existující e-mail
import crypto from "crypto";
import fs from "fs";
import path from "path";

const DATA_DIR = process.env.TOL_DATA_DIR ?? path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "account.json");

type User = {
  id: string;
  email: string;
  emailVerifiedAt: number | null;
  introUsedAt: number | null;
  dailyOptInAt: number | null;
  createdAt: number;
};
type LedgerEntry = {
  id: string;
  userId: string;
  delta: number; // +N nákup, -1 čerpání; zůstatek = SUM
  reason: "pack_purchase" | "reading_consume" | "adjustment";
  ref: string; // idempotence: paymentIntentId / readingSessionId
  createdAt: number;
};
type Otp = {
  id: string;
  email: string;
  purpose: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
  usedAt: number | null;
  supersededAt: number | null;
  createdAt: number;
};
type Session = { token: string; userId: string; createdAt: number };
type RateEvent = { key: string; at: number };
type Lock = { email: string; until: number };

type Db = {
  users: User[];
  ledger: LedgerEntry[];
  otps: Otp[];
  sessions: Session[];
  rates: RateEvent[];
  locks: Lock[];
};

function load(): Db {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return { users: [], ledger: [], otps: [], sessions: [], rates: [], locks: [] };
  }
}
function save(db: Db) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(db), "utf8");
}

// jednoduchý in-process mutex: serializuje transakce (mock náhrada DB transakcí)
let chain: Promise<unknown> = Promise.resolve();
function tx<T>(fn: (db: Db) => T): Promise<T> {
  const run = chain.then(() => {
    const db = load();
    const out = fn(db);
    save(db);
    return out;
  });
  chain = run.catch(() => {});
  return run;
}

const id = () => crypto.randomBytes(12).toString("hex");
const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
const norm = (e: string) => e.trim().toLowerCase();

/* ---------------- users ---------------- */
export function getOrCreateUser(db: Db, email: string): User {
  const em = norm(email);
  let u = db.users.find((x) => x.email === em);
  if (!u) {
    u = { id: id(), email: em, emailVerifiedAt: null, introUsedAt: null, dailyOptInAt: null, createdAt: Date.now() };
    db.users.push(u);
  }
  return u;
}

/* ---------------- ledger (v1 §4) ---------------- */
export function balanceOf(db: Db, userId: string): number {
  return db.ledger.filter((l) => l.userId === userId).reduce((s, l) => s + l.delta, 0);
}

/** Idempotentní připsání kreditu (webhook smí přijít vícekrát). */
export async function creditPurchase(email: string, credits: number, paymentIntentId: string) {
  return tx((db) => {
    const u = getOrCreateUser(db, email);
    const ref = `pi:${paymentIntentId}`;
    if (db.ledger.some((l) => l.ref === ref)) {
      return { ok: true as const, duplicated: true, balance: balanceOf(db, u.id) };
    }
    db.ledger.push({ id: id(), userId: u.id, delta: credits, reason: "pack_purchase", ref, createdAt: Date.now() });
    return { ok: true as const, duplicated: false, balance: balanceOf(db, u.id) };
  });
}

/** Transakční čerpání: při zůstatku 0 odmítá SERVER. Idempotentní na ref. */
export async function consumeCredit(userId: string, readingRef: string) {
  return tx((db) => {
    const ref = `read:${readingRef}`;
    if (db.ledger.some((l) => l.ref === ref)) {
      return { ok: true as const, balance: balanceOf(db, userId) };
    }
    const bal = balanceOf(db, userId);
    if (bal <= 0) return { ok: false as const, error: "insufficient", balance: 0 };
    db.ledger.push({ id: id(), userId, delta: -1, reason: "reading_consume", ref, createdAt: Date.now() });
    return { ok: true as const, balance: bal - 1 };
  });
}

/** Intro cena server-side, jen jednou na účet (test A.5). */
export async function tryUseIntro(email: string) {
  return tx((db) => {
    const u = getOrCreateUser(db, email);
    if (u.introUsedAt) return { ok: false as const };
    u.introUsedAt = Date.now();
    return { ok: true as const };
  });
}

export async function getBalanceByEmail(email: string) {
  return tx((db) => {
    const u = db.users.find((x) => x.email === norm(email));
    return u ? balanceOf(db, u.id) : 0;
  });
}

/* ---------------- OTP (v1.1 §B.2) ---------------- */
const OTP_TTL_MS = 10 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;
const RESEND_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const ADDR_PER_HOUR = 5;
const IP_PER_HOUR = 15;

function pruneRates(db: Db) {
  const cut = Date.now() - 3600_000;
  db.rates = db.rates.filter((r) => r.at > cut);
  db.locks = db.locks.filter((l) => l.until > Date.now());
}

export async function requestOtp(email: string, purpose: string, ip: string) {
  return tx((db) => {
    pruneRates(db);
    const em = norm(email);
    // Identická odpověď pro existující i neexistující adresu (test A.6):
    // veškeré chyby limitů vracíme stejně jako úspěch, jen kód nepošleme.
    const lock = db.locks.find((l) => l.email === em);
    if (lock) return { ok: true as const, sent: false };
    const addrCount = db.rates.filter((r) => r.key === `a:${em}`).length;
    const ipCount = db.rates.filter((r) => r.key === `i:${ip}`).length;
    if (addrCount >= ADDR_PER_HOUR || ipCount >= IP_PER_HOUR) {
      return { ok: true as const, sent: false };
    }
    const last = db.otps
      .filter((o) => o.email === em && o.purpose === purpose && !o.supersededAt)
      .sort((a, b) => b.createdAt - a.createdAt)[0];
    if (last && Date.now() - last.createdAt < RESEND_MS) {
      return { ok: true as const, sent: false };
    }
    // nový kód invaliduje předchozí
    for (const o of db.otps) {
      if (o.email === em && o.purpose === purpose && !o.usedAt) o.supersededAt = Date.now();
    }
    const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
    db.otps.push({
      id: id(), email: em, purpose, codeHash: sha(code),
      expiresAt: Date.now() + OTP_TTL_MS, attempts: 0, usedAt: null,
      supersededAt: null, createdAt: Date.now(),
    });
    db.rates.push({ key: `a:${em}`, at: Date.now() }, { key: `i:${ip}`, at: Date.now() });
    getOrCreateUser(db, em);
    return { ok: true as const, sent: true, code }; // code jde JEN do e-mailu, nikdy do API odpovědi
  });
}

/** v1.3 §5: TESTOVACÍ režim (preview/lokálně, NIKDY produkce - hlídá
 * deploy check i volající route). Přepíše hash posledního aktivního OTP
 * na pevný TEST_OTP_CODE, aby šel zadat bez čtení e-mailu. Všechny
 * ostatní limity (TTL, pokusy, zámek) platí beze změny. */
export async function overrideOtpCode(email: string, purpose: string, code: string) {
  return tx((db) => {
    const em = norm(email);
    const otp = db.otps
      .filter((o) => o.email === em && o.purpose === purpose && !o.supersededAt && !o.usedAt)
      .sort((a, b) => b.createdAt - a.createdAt)[0];
    if (otp) otp.codeHash = sha(code);
    return { ok: true as const };
  });
}

export type VerifyResult =
  | { ok: true; sessionToken?: string }
  | { ok: false; error: "invalid" | "expired" | "locked"; attemptsLeft?: number };

export async function verifyOtp(email: string, purpose: string, code: string, createSession: boolean): Promise<VerifyResult> {
  return tx((db) => {
    pruneRates(db);
    const em = norm(email);
    if (db.locks.some((l) => l.email === em)) return { ok: false, error: "locked" as const };
    const otp = db.otps
      .filter((o) => o.email === em && o.purpose === purpose && !o.supersededAt && !o.usedAt)
      .sort((a, b) => b.createdAt - a.createdAt)[0];
    if (!otp) return { ok: false, error: "invalid" as const };
    if (Date.now() > otp.expiresAt) return { ok: false, error: "expired" as const };
    if (otp.codeHash !== sha(code)) {
      otp.attempts += 1;
      if (otp.attempts >= MAX_ATTEMPTS) {
        db.locks.push({ email: em, until: Date.now() + LOCK_MS });
        return { ok: false, error: "locked" as const };
      }
      return { ok: false, error: "invalid" as const, attemptsLeft: MAX_ATTEMPTS - otp.attempts };
    }
    otp.usedAt = Date.now(); // jednorázovost
    const u = getOrCreateUser(db, em);
    u.emailVerifiedAt = u.emailVerifiedAt ?? Date.now(); // = ověření, žádný extra krok
    if (purpose === "daily_card_optin") u.dailyOptInAt = Date.now();
    if (!createSession) return { ok: true as const };
    const token = crypto.randomBytes(24).toString("hex");
    db.sessions.push({ token, userId: u.id, createdAt: Date.now() });
    return { ok: true as const, sessionToken: token };
  });
}

/* ---------------- sessions ---------------- */
export async function sessionUser(token: string | undefined | null) {
  if (!token) return null;
  return tx((db) => {
    const s = db.sessions.find((x) => x.token === token);
    if (!s) return null;
    const u = db.users.find((x) => x.id === s.userId);
    return u ? { userId: u.id, email: u.email } : null;
  });
}
export async function destroySession(token: string | undefined | null) {
  if (!token) return;
  return tx((db) => {
    db.sessions = db.sessions.filter((s) => s.token !== token);
  });
}
