// MOCK: replace with production (vlastní AI model na AWS)
// Výkladový engine v2 dle zadání v1 §6.1 + dikce G (v1.1):
// - struktura: úvod k otázce -> blok na kartu (mini-nadpis) -> syntéza -> krok
// - ano/ne: směrová odpověď v PRVNÍ větě, disclaimer až potom (6.1.4)
//   a směr se ZOPAKUJE i v závěru (v1.1 checklist)
// - bloky karet: 2-3 věty s vazbou na téma otázky (v1.1 H.4)
// - časové otázky: laskavé přerámování, žádná data (6.1.5)
// - obrácené karty: konkrétní význam, ne vata (6.1.6)
// - mimo záběr (zdraví/právo/finance): vztahově-emoční rovina + odborník (6.1.8)
// - podpis přes PERSONA_NAME (6.1.10, invariant 4)
// Zákaz: predikce („vrátí se ti"), dlouhé pomlčky, vykřičníky, „vibrace",
// „vesmír", zdrobněliny, inverzní básnické vzory („Nevyřčená zůstala…").
// NÁVRH: SAMPLE_* níže jsou přepsané v dikci G a čekají na schválení
// zakladatelem (původní z 9.2 obsahovaly zakázané vzory).
import { CARD_BY_ID } from "./cards";
import { SpreadKey } from "./spreads";
import { PERSONA_NAME } from "./persona";

type PickedCard = { cardId: string; name: string; reversed: boolean; position: string };

const SAMPLE_BETWEEN_US =
  "Tvoje karta je Dvojka pohárů: do vztahu jdeš srdcem napřed a čekáš, že to ucítí sám. Jeho karta je Rytíř pentaklů, muž, který jede pomalu a city ukazuje skutky, ne slovy. Vaše společná karta je Slunce, mezi vámi je pořád opravdové světlo. Problém není láska, ale jazyk, kterým o ní mluvíte. Zkus mu říct, co potřebuješ, ne jen co cítíš.";

const SAMPLE_MY_EX =
  "Mág říká, že vedle něj zůstala schovaná tvoje vlastní síla. Cítila ses malá, i když jsi nebyla. Věž ukazuje pád něčeho, co stálo na slabých základech, a takový pád se nedá odestát. Drží tě Trojka mečů, bolest, kterou se bojíš položit. Pustit potřebuješ Osmičku pohárů, představu, že kdybys vydržela déle, dopadlo by to jinak. Lekce je Poustevník: cesta zpátky vede k tobě, ne k němu. A před tebou stojí Hvězda, naděje, která přijde, jakmile jí uděláš místo. Dnes večer si napiš jednu větu, kterou jsi mu nikdy neřekla. Nemusíš ji posílat.";

const SAMPLE_YESNO =
  "Karty teď říkají spíš ne. Věž obráceně je pád, který visí ve vzduchu, protože ho oddaluješ. Psát chceš proto, že tě děsí ticho, ne proto, že ti chybí on. Vydrž sedm dní. Jestli budeš chtít napsat i potom, piš s klidem, ne z úzkosti. Takže za karty ještě jednou: teď spíš ne.";

const SAMPLE_DAILY_SLUNCE =
  "Dnes ti svítí Slunce: jasnost a radost, kterých se nemusíš bát. Po těžších dnech přichází světlo a smí se prožít. Malý krok pro dnešek: zavolej někomu, s kým se směješ.";

const SIGNATURE = `${PERSONA_NAME}, tvoje AI kartářka`;

/* ---------- deterministická variabilita (proti šablonovitosti, 6.2) ---------- */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function pick<T>(arr: T[], seed: number, salt: number): T {
  return arr[(seed + salt) % arr.length];
}

/* ---------- významy: velká arkána (rovně / obráceně konkrétně) ---------- */
const MAJOR: Record<string, { up: string; rev: string }> = {
  blazen: { up: "chuť začít znovu, s lehkostí a bez záruk", rev: "skok, který odkládáš ze strachu, že se ztrapníš" },
  mag: { up: "máš v rukou víc nástrojů, než si přiznáváš", rev: "energie se rozptyluje do slov místo činů" },
  veleknezka: { up: "odpověď už v sobě nosíš, jen jí nedáváš slovo", rev: "přehlušuješ vlastní intuici cizími radami" },
  cisarovna: { up: "péče a hojnost, které chtějí proudit ven i dovnitř", rev: "dáváš tolik, že na tebe nezbývá" },
  cisar: { up: "potřeba pevné půdy a jasných pravidel", rev: "kontrola, která ti bere blízkost" },
  veleknez: { up: "opora v tom, co je osvědčené a společné", rev: "pravidla, která už dávno nejsou tvoje" },
  zamilovani: { up: "volba srdce, která chce být vyslovena nahlas", rev: "rozpolcenost mezi tím, co cítíš a co se čeká" },
  vuz: { up: "tah vpřed, když otěže držíš ty", rev: "síla, která se točí v kruhu bez směru" },
  sila: { up: "jemnost, která zvládne víc než nátlak", rev: "tvrdost k sobě, kterou nikdo nevidí" },
  poustevnik: { up: "chvíle o samotě, která ti vrátí jasno", rev: "samota, která už není volbou, ale úkrytem" },
  "kolo-stesti": { up: "okolnosti se hýbou, i když ty stojíš", rev: "pocit, že se točíš dokola v tomtéž" },
  spravedlnost: { up: "věci se srovnávají podle toho, co je fér", rev: "nespravedlnost, kterou sama sobě děláš" },
  viselec: { up: "jiný úhel pohledu, který se vyplatí vydržet", rev: "čekání, které se stalo výmluvou" },
  smrt: { up: "konec jedné kapitoly, který uvolňuje místo", rev: "držíš při životě něco, co už dýchá jen z tvé síly" },
  mirnost: { up: "míchání protikladů do klidné rovnováhy", rev: "extrémy, mezi kterými přeskakuješ" },
  dabel: { up: "pouto, které láká, i když svazuje", rev: "řetěz, který jde sundat, jen se bojíš prázdných rukou" },
  vez: { up: "otřes, který bourá jen to nestabilní", rev: "odkládaný pád, který visí ve vzduchu" },
  hvezda: { up: "tichá naděje, která se vrací po bouři", rev: "víra v dobré konce, kterou sis zakázala" },
  mesic: { up: "mlha domněnek, ve které nic není jisté", rev: "strach, který se ukazuje větší, než je" },
  slunce: { up: "jasnost a radost, které se nemusíš bát", rev: "světlo, před kterým se schováváš" },
  soud: { up: "volání po upřímném zúčtování se sebou", rev: "výčitky, které přehlušují druhou šanci" },
  svet: { up: "uzavřený kruh a pocit celistvosti", rev: "krok před cílem, kde se zastavuješ" },
};

/* ---------- malá arkána: barva x hodnost (rovně / obráceně) ---------- */
const SUIT_THEME: Record<string, { up: string; rev: string }> = {
  pohary: { up: "cit, který chce být sdílený", rev: "emoce, kterou zadržuješ, až tě přetéká" },
  mece: { up: "myšlenka, která potřebuje jasné slovo", rev: "myšlenky v kruhu, které řežou hlavně tebe" },
  hole: { up: "energie a chuť, které tlačí dopředu", rev: "zápal, který nemá kam růst" },
  pentakly: { up: "jistota a hodnota, které se budují pomalu", rev: "jistota, které obětuješ víc, než vynáší" },
};
const RANK_TONE: Record<string, string> = {
  eso: "nový začátek",
  dvojka: "vztah dvou stran",
  trojka: "první plody i první trhliny",
  ctyrka: "stabilita, která může ztěžknout",
  petka: "ztráta, která učí",
  sestka: "návrat rovnováhy",
  sedmicka: "volba mezi mnoha cestami",
  osmicka: "pohyb, který nejde zastavit",
  devitka: "vnitřní svět v plné síle",
  desitka: "završení cyklu",
  paze: "zvědavost a první krok",
  rytir: "odhodlání v pohybu",
  kralovna: "zralá péče o cit",
  kral: "vláda nad vlastním územím",
};

function cardMeaning(card: PickedCard): string {
  const m = MAJOR[card.cardId];
  if (m) return card.reversed ? m.rev : m.up;
  const [rank, suit] = card.cardId.split("-");
  const st = SUIT_THEME[suit];
  const rt = RANK_TONE[rank];
  if (st && rt) {
    return card.reversed ? `${rt}, ale ${st.rev}` : `${rt}: ${st.up}`;
  }
  return card.reversed
    ? "obrácená ukazuje na místo, kde se něco zadrhlo a chce pozornost"
    : "nese energii, která ti teď chce něco ukázat";
}

/* ---------- detekce typu otázky ---------- */
const TIME_RX = /\bkdy\b|\bdo kdy\b|jak dlouho|za jak dlouho|kolik času/i;
const HEALTH_RX = /nemoc|zdrav|těhot|doktor|léčb|diagn|rakovin/i;
const LEGAL_FIN_RX = /soud|právník|žalob|dluh|exekuc|hypoték|invest|akci[eí]|krypto/i;

function isTimeQuestion(q: string): boolean {
  return TIME_RX.test(q);
}
function outOfScope(q: string): "zdraví" | "právo či finance" | null {
  if (HEALTH_RX.test(q)) return "zdraví";
  if (LEGAL_FIN_RX.test(q)) return "právo či finance";
  return null;
}

/* ---------- stavební bloky ---------- */
function capital(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function intro(question: string, seed: number): string {
  const q = question.trim();
  const opts = [
    "Podívala jsem se na tvou otázku a karty k ní mluví překvapivě souvisle.",
    "Tvoje otázka má váhu a karty ji nepřecházejí mlčením.",
    "Sedla jsem si nad tvou otázku a tohle z karet vystupuje nejjasněji.",
  ];
  return q ? pick(opts, seed, 1) : "Dnešní karta ti nese krátký vzkaz.";
}

/* ---------- vazba bloku na téma otázky (v1.1 H.4) ---------- */
function questionTheme(q: string): string {
  const t = q.toLowerCase();
  if (/\bex\b|bývalý|bývalej|rozchod/.test(t)) return "tam, kde řešíš svého ex";
  if (/ozve|napíše|zavolá|kontakt/.test(t)) return "tam, kde čekáš, jestli se ozve";
  if (/čekat|vydržet|počkat/.test(t)) return "tam, kde zvažuješ, jestli čekat dál";
  if (/cítí|miluje|myslí na mě/.test(t)) return "tam, kde se ptáš na jeho city";
  if (/vrátí|zpátky|znovu spolu/.test(t)) return "tam, kde doufáš v návrat";
  if (/nový|nového|potkám|přijde/.test(t)) return "tam, kde vyhlížíš nový začátek";
  if (/odpustit|odpuštění|zrad|podved/.test(t)) return "tam, kde vážíš odpuštění";
  return "tam, kam míří tvoje otázka";
}

function questionTie(question: string, seed: number, i: number): string {
  const theme = questionTheme(question);
  const opts = [
    `Nejvíc se to teď ukazuje ${theme}.`,
    `Čti ji ${theme}: přesně tam má co říct.`,
    `A ${theme} je to znát ze všeho nejvíc.`,
  ];
  return pick(opts, seed, i + 5);
}

function cardBlock(card: PickedCard, seed: number, i: number, question = ""): string {
  const c = CARD_BY_ID[card.cardId];
  const name = `${c?.name ?? card.name}${card.reversed ? ", obráceně" : ""}`;
  const lead = pick(["mluví o tom, že je tu", "ukazuje na", "připomíná ti"], seed, i + 2);
  // 2-3 věty: karetní obraz + lidský překlad, druhá věta váže na otázku (H.4)
  const tie = question.trim() ? ` ${questionTie(question, seed, i)}` : "";
  return `✦ ${name} · ${card.position}\n${capital(lead)} ${cardMeaning(card)}.${tie}`;
}

function synthesis(cards: PickedCard[], seed: number): string {
  const revCount = cards.filter((c) => c.reversed).length;
  const opts =
    revCount >= Math.ceil(cards.length / 2)
      ? [
          "Dohromady karty říkají: víc než okolnosti tě teď brzdí to, co se děje uvnitř. A to je dobrá zpráva, protože vnitřek máš ve svých rukou.",
          "Když karty složím vedle sebe, mluví hlavně o zadrženém pohybu. Nic z toho není rozsudek, spíš pozvánka podívat se, co držíš a proč.",
        ]
      : [
          "Dohromady karty kreslí obraz, který má směr. Nemluví o tom, co se stane, ale o tom, s čím můžeš pracovat už dnes.",
          "Když je složím vedle sebe, vychází z nich víc síly než nejistoty. Otázka nezní jestli, ale jak po svém.",
        ];
  return pick(opts, seed, 7);
}

function actionStep(seed: number): string {
  const opts = [
    "Malý krok pro dnešek: napiš si jednu větu o tom, co doopravdy potřebuješ, a nech ji do zítřka uležet.",
    "Malý krok pro dnešek: řekni nahlas, čeho se v téhle situaci nejvíc bojíš. Jen pro sebe. Strach pojmenovaný je o polovinu menší.",
    "Malý krok pro dnešek: udělej jednu drobnost jinak než obvykle a všimni si, co to s tebou udělá.",
  ];
  return pick(opts, seed, 11);
}

/* ---------- ano/ne: směr v PRVNÍ větě a ZNOVU v závěru (6.1.4 + v1.1) ---------- */
function yesNoReading(card: PickedCard, seed: number, question = ""): string {
  const lean = card.reversed ? "spíš k ne" : "spíš k ano";
  const leanShort = card.reversed ? "spíš ne" : "spíš ano";
  const nuance = card.reversed
    ? "Ne proto, že by bylo všechno ztracené, ale proto, že odpověď, kterou hledáš venku, zatím nemáš srovnanou uvnitř."
    : "Ne jako slib, ale jako směr: okolnosti ti nahrávají víc, než si připouštíš.";
  const disclaimer =
    "A jedno upřímné připomenutí: karty neznají budoucnost a já ti ji slibovat nebudu. Ukazují, kde stojíš teď.";
  return [
    `Karty se teď kloní ${lean}. ${nuance}`,
    cardBlock(card, seed, 0, question),
    disclaimer,
    actionStep(seed),
    `Takže ještě jednou, ať to nezapadne: teď je to ${leanShort}.`,
    SIGNATURE,
  ].join("\n\n");
}

/* ---------- hlavní vstup ---------- */
function matches(cards: PickedCard[], ids: string[]): boolean {
  return cards.length === ids.length && cards.every((c, i) => c.cardId === ids[i]);
}

export function mockReading(
  spread: SpreadKey,
  question: string,
  cards: PickedCard[]
): string {
  // doslovné ukázky z 9.2 pro referenční kombinace (kvalitativní laťka)
  if (spread === "between_us" && matches(cards, ["dvojka-pohary", "rytir-pentakly", "slunce"]))
    return SAMPLE_BETWEEN_US;
  if (
    spread === "my_ex" &&
    matches(cards, ["mag", "vez", "trojka-mece", "osmicka-pohary", "poustevnik", "hvezda"])
  )
    return SAMPLE_MY_EX;
  if (spread === "yesno" && cards[0]?.cardId === "vez" && cards[0]?.reversed)
    return SAMPLE_YESNO;
  if (spread === "daily" && cards[0]?.cardId === "slunce" && !cards[0]?.reversed)
    return SAMPLE_DAILY_SLUNCE;

  const seed = hash(
    question + "|" + cards.map((c) => c.cardId + (c.reversed ? "r" : "")).join(",")
  );
  const parts: string[] = [];

  // 6.1.8: témata mimo záběr -> vztahově-emoční rovina + doporučení odborníka
  const oos = outOfScope(question);
  if (oos) {
    parts.push(
      oos === "zdraví"
        ? "Ještě než se podíváme na karty: na otázky o zdraví ti karty ani já odpovědět neumíme a nebylo by fér to předstírat. S tímhle prosím za lékařem. Karty ti ale můžou pomoct s tím, co ta nejistota dělá s tvým srdcem."
        : "Ještě než se podíváme na karty: tam, kde jde o právo či finance, patří rozhodnutí do rukou odborníka, ne karet. Co karty umí, je podívat se na to, co ta situace dělá s tebou a tvými vztahy."
    );
  }

  // 6.1.5: časové otázky bez dat a termínů
  if (isTimeQuestion(question)) {
    parts.push(
      "Ptáš se na čas, a to je právě otázka, na kterou karty neumí odpovědět kalendářem. Neřeknou kdy. Umí ale ukázat, co tomu, na co čekáš, stojí v cestě, a co z toho je ve tvých rukou."
    );
  }

  if (spread === "yesno" && cards[0]) {
    // směrová odpověď musí zůstat první větou samotného výkladu
    const head = parts.length ? parts.join("\n\n") + "\n\n" : "";
    return head + yesNoReading(cards[0], seed, question);
  }

  if (!parts.length) parts.push(intro(question, seed));
  cards.forEach((c, i) => parts.push(cardBlock(c, seed, i, spread === "daily" ? "" : question)));
  if (spread !== "daily" && cards.length > 1) parts.push(synthesis(cards, seed));
  parts.push(actionStep(seed));
  parts.push(SIGNATURE);
  return parts.join("\n\n");
}

/* ---------- kontrola šablonovitosti (6.2): n-gram překryv dvou textů ---------- */
export function nGramOverlap(a: string, b: string, n = 4): number {
  const grams = (t: string) => {
    const w = t
      .toLowerCase()
      .replace(/[^a-záčďéěíňóřšťúůýž0-9\s]/gi, "")
      .split(/\s+/)
      .filter(Boolean);
    const g = new Set<string>();
    for (let i = 0; i + n <= w.length; i++) g.add(w.slice(i, i + n).join(" "));
    return g;
  };
  const A = grams(a);
  const B = grams(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  A.forEach((g) => B.has(g) && inter++);
  return inter / Math.min(A.size, B.size);
}
