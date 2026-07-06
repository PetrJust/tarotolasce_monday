// Úložiště výkladů a hodnocení.
// - Když je nastavená DATABASE_URL, ukládá do PostgreSQL (produkce).
// - Bez ní ukládá do souboru .data/*.json (lokální/mock režim), aby data
//   přežila restart dev serveru.
// Rozhraní je async; volající (API routes, server komponenty) await-ují.
import fs from "fs";
import path from "path";
import { dbQuery, hasDb } from "./db";

export type SavedReading = {
  id: string;
  email: string | null;
  question: string;
  spreadKey: string;
  spreadName: string;
  cards: { cardId: string; name: string; reversed: boolean; position: string }[];
  text: string;
  createdAt: number;
};

export type Feedback = { rating: "up" | "down"; comment: string; createdAt: number };

/* ---------------- souborový mock (fallback) ---------------- */
const DATA_DIR = path.join(process.cwd(), ".data");
const READINGS_FILE = path.join(DATA_DIR, "readings.json");
const FEEDBACK_FILE = path.join(DATA_DIR, "feedback.json");

const readings = new Map<string, SavedReading>();
const feedback = new Map<string, Feedback>();
let loaded = false;

function loadFiles() {
  if (loaded) return;
  loaded = true;
  try {
    const arr: SavedReading[] = JSON.parse(fs.readFileSync(READINGS_FILE, "utf8"));
    for (const r of arr) readings.set(r.id, r);
  } catch {
    /* soubor zatím neexistuje */
  }
  try {
    const ent: [string, Feedback][] = JSON.parse(fs.readFileSync(FEEDBACK_FILE, "utf8"));
    for (const [k, v] of ent) feedback.set(k, v);
  } catch {
    /* ok */
  }
}

function persistReadings() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(READINGS_FILE, JSON.stringify([...readings.values()]), "utf8");
  } catch {
    /* mock */
  }
}
function persistFeedback() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify([...feedback.entries()]), "utf8");
  } catch {
    /* mock */
  }
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/* ---------------- veřejné API ---------------- */
export async function saveReading(
  r: Omit<SavedReading, "id" | "createdAt">
): Promise<SavedReading> {
  const saved: SavedReading = { ...r, id: newId("v"), createdAt: Date.now() };
  if (hasDb()) {
    await dbQuery(
      `insert into readings (id, email, question, spread_key, spread_name, cards, text, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        saved.id,
        saved.email,
        saved.question,
        saved.spreadKey,
        saved.spreadName,
        JSON.stringify(saved.cards),
        saved.text,
        saved.createdAt,
      ]
    );
    return saved;
  }
  loadFiles();
  readings.set(saved.id, saved);
  persistReadings();
  return saved;
}

export async function getReading(id: string): Promise<SavedReading | undefined> {
  if (hasDb()) {
    const res = await dbQuery(`select * from readings where id = $1`, [id]);
    const row = res?.rows?.[0];
    if (!row) return undefined;
    return rowToReading(row);
  }
  loadFiles();
  return readings.get(id);
}

export async function readingsByEmail(email: string): Promise<SavedReading[]> {
  if (hasDb()) {
    const res = await dbQuery(
      `select * from readings where email = $1 order by created_at desc`,
      [email]
    );
    return (res?.rows ?? []).map(rowToReading);
  }
  loadFiles();
  return [...readings.values()]
    .filter((r) => r.email === email)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveFeedback(
  readingId: string,
  rating: "up" | "down",
  comment: string
): Promise<void> {
  const createdAt = Date.now();
  if (hasDb()) {
    await dbQuery(
      `insert into feedback (reading_id, rating, comment, created_at)
       values ($1,$2,$3,$4)
       on conflict (reading_id) do update set rating = excluded.rating,
         comment = excluded.comment, created_at = excluded.created_at`,
      [readingId, rating, comment, createdAt]
    );
    return;
  }
  loadFiles();
  feedback.set(readingId, { rating, comment, createdAt });
  persistFeedback();
}

function rowToReading(row: any): SavedReading {
  return {
    id: row.id,
    email: row.email,
    question: row.question,
    spreadKey: row.spread_key,
    spreadName: row.spread_name,
    cards: typeof row.cards === "string" ? JSON.parse(row.cards) : row.cards,
    text: row.text,
    createdAt: Number(row.created_at),
  };
}
