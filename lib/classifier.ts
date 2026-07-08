import { SpreadKey } from "./spreads";

export type ClassifyResult = { spread: Exclude<SpreadKey, "daily">; reason: string };

const EX_KEYWORDS = [
  // kmeny pokrývají skloňované tvary: bývalý/bývalá/bývalého/bývalém,
  // rozchod/rozchodu, rozešli/rozešel, opustil/opustila
  "ex", "býval", "bejval", "rozchod", "rozešl", "rozešel",
  "opustil", "pořád na něj myslím", "pořád na ni myslím",
];

const BINARY_STARTS = [
  "mám", "má", "je", "bude", "vrátí", "miluje", "myslí", "stojí",
];

const RELATION_KEYWORDS = [
  "mezi námi", "vztah", "my dva", "partner", "manžel", "přítel",
];

function hasExKeyword(q: string): boolean {
  const lower = ` ${q.toLowerCase()} `;
  if (EX_KEYWORDS.some((k) => lower.includes(k.length <= 2 ? ` ${k}` : k))) return true;
  // „vrátí se mi [jméno]"
  if (/vrátí se mi \S+/.test(lower)) return true;
  return false;
}

// Pořadí vyhodnocení: 1. ex, 2. binární, 3. vztahová, 4. default
export function classify(question: string): ClassifyResult {
  const q = question.trim();
  const lower = q.toLowerCase();
  const words = lower.split(/\s+/).filter(Boolean);

  if (hasExKeyword(q)) {
    return { spread: "my_ex", reason: "ex-téma" };
  }

  const startsBinary = BINARY_STARTS.some((s) =>
    lower.startsWith(s + " ") || lower === s
  );
  const shortNoEx = words.length <= 8;
  if (startsBinary && (q.includes("?") || shortNoEx)) {
    return { spread: "yesno", reason: "binární otázka" };
  }

  const hasRelation =
    RELATION_KEYWORDS.some((k) => lower.includes(k)) ||
    /\bon\b|\bona\b/.test(lower);
  if (hasRelation) {
    return { spread: "between_us", reason: "vztahová otázka" };
  }

  return { spread: "between_us", reason: "default" };
}


/* ---------- kategorie otázky (v1.6 §1, podklad Brány 4.1) ----------
 * Tentýž klasifikátor od dne 1 určuje i kategorii; loguje se event
 * question_category (kategorie + příznak zaplaceno/ochutnávka).
 * MOCK heuristika; v produkci stejný model jako typ výkladu. */
export type QuestionCategory = "láska" | "práce" | "peníze" | "životní cesta" | "jiné";

export function categorize(question: string): QuestionCategory {
  const q = ` ${question.toLowerCase()} `;
  if (/prác|šéf|kariér|zaměstnán|povýšen|kolegy|výpověď|pohovor|firmě|brigád/.test(q)) return "práce";
  if (/peníz|penz|dluh|hypoték|investic|výplat|finanč|našetř|koupit byt|exekuc/.test(q)) return "peníze";
  if (/smysl život|kam směřuj|životní cest|co mám dělat se život|najdu se|své místo|poslání|změnit život/.test(q)) return "životní cesta";
  if (/miluj|láska|lásce|vztah|cítí|ozve|ex |býval|rozchod|napsat mu|napsat jí|rande|přítel|partner|manžel|srdc|city|políb|věrn|podvád/.test(q)) return "láska";
  return "jiné";
}
