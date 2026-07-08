// MOCK: replace with production (server-side session store)
// Míchání je deterministické podle sessionId: stejná session = stejné pořadí.
import { DECK, Card } from "./cards";
import { SPREADS, SpreadKey } from "./spreads";

export type ShuffledCard = { card: Card; reversed: boolean };

export type RitualSession = {
  id: string;
  spread: SpreadKey;
  order: ShuffledCard[]; // pořadí se NIKDY neposílá klientovi celé
  picked: number[]; // indexy do vějíře, v pořadí výběru
  createdAt: number;
};

const sessions = new Map<string, RitualSession>();

// mulberry32: seeded PRNG
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffleDeck(seed: number): ShuffledCard[] {
  const rng = mulberry32(seed);
  const arr = DECK.map((card) => ({
    card,
    reversed: false,
  }));
  // Fisher–Yates
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // 27 % pravděpodobnost obrácení, rozhodnuto při serverovém míchání
  for (const item of arr) {
    item.reversed = rng() < 0.27;
  }
  return arr;
}

export function createSession(spread: SpreadKey): RitualSession {
  // Rozklad kódujeme za tečku (klíče rozkladů obsahují podtržítko, např. my_ex),
  // aby se dal spolehlivě vyparsovat při deterministické rekonstrukci.
  const id = `s.${spread}.${Date.now().toString(36)}.${Math.random().toString(36).slice(2, 10)}`;
  const session: RitualSession = {
    id,
    spread,
    order: shuffleDeck(hashString(id)),
    picked: [],
    createdAt: Date.now(),
  };
  sessions.set(id, session);
  return session;
}

export function getSession(id: string): RitualSession | undefined {
  let s = sessions.get(id);
  if (!s && (id.startsWith("s.") || id.startsWith("s_"))) {
    // Deterministická rekonstrukce: pořadí závisí jen na sessionId,
    // takže stejná session vrací stejné pořadí i po restartu serveru.
    // Rozklad je zakódovaný v id za tečkou (s.{spread}.…). Starší id s
    // podtržítkem zkusíme rozpoznat porovnáním se známými klíči rozkladů.
    let spreadFromId: string | undefined;
    if (id.startsWith("s.")) {
      spreadFromId = id.split(".")[1];
    } else {
      const rest = id.slice(2); // bez "s_"
      spreadFromId = (Object.keys(SPREADS) as string[]).find((k) =>
        rest.startsWith(k + "_")
      );
    }
    const spread = (spreadFromId && SPREADS[spreadFromId as SpreadKey]
      ? spreadFromId
      : "between_us") as SpreadKey;
    s = {
      id,
      spread,
      order: shuffleDeck(hashString(id)),
      picked: [],
      createdAt: Date.now(),
    };
    sessions.set(id, s);
  }
  return s;
}

export function pickCard(sessionId: string, index: number) {
  const s = getSession(sessionId);
  if (!s) return null;
  if (index < 0 || index >= 78) return null;
  if (s.picked.includes(index)) return null;
  const max = SPREADS[s.spread].cardCount;
  if (s.picked.length >= max) return null;
  s.picked.push(index);
  const { card, reversed } = s.order[index];
  const position = SPREADS[s.spread].positions[s.picked.length - 1];
  return { cardId: card.id, name: card.name, reversed, position };
}

// Krok zpět: uvolní dříve vybranou kartu, aby výběr na serveru i klientovi
// zůstal konzistentní (funguje až do otočení karet).
export function unpickCard(sessionId: string, index: number) {
  const s = getSession(sessionId);
  if (!s) return null;
  const at = s.picked.indexOf(index);
  if (at < 0) return null;
  s.picked.splice(at, 1);
  return { ok: true };
}
