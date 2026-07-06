// 78 karet: 22 velkých arkán + 4 barvy × 14
export type Card = {
  id: string; // slug bez diakritiky
  name: string; // český název
  arcana: "major" | "minor";
  suit?: "pohary" | "mece" | "hole" | "pentakly";
  rank?: string;
  symbol: string; // jednoduchý symbol pro placeholder líce
};

const MAJORS: [string, string, string][] = [
  ["blazen", "Blázen", "☉"],
  ["mag", "Mág", "∞"],
  ["veleknezka", "Velekněžka", "☾"],
  ["cisarovna", "Císařovna", "♀"],
  ["cisar", "Císař", "♂"],
  ["veleknez", "Velekněz", "♁"],
  ["zamilovani", "Zamilovaní", "♡"],
  ["vuz", "Vůz", "▲"],
  ["sila", "Síla", "∞"],
  ["poustevnik", "Poustevník", "✶"],
  ["kolo-stesti", "Kolo štěstí", "◎"],
  ["spravedlnost", "Spravedlnost", "⚖"],
  ["viselec", "Viselec", "⟂"],
  ["smrt", "Smrt", "✕"],
  ["mirnost", "Mírnost", "≈"],
  ["dabel", "Ďábel", "♆"],
  ["vez", "Věž", "⚡"],
  ["hvezda", "Hvězda", "✦"],
  ["mesic", "Měsíc", "☽"],
  ["slunce", "Slunce", "☀"],
  ["soud", "Soud", "♪"],
  ["svet", "Svět", "◯"],
];

const SUITS: { key: Card["suit"]; cz: string; czGen: string; symbol: string }[] = [
  { key: "pohary", cz: "pohárů", czGen: "Pohár", symbol: "∪" },
  { key: "mece", cz: "mečů", czGen: "Meč", symbol: "†" },
  { key: "hole", cz: "holí", czGen: "Hůl", symbol: "|" },
  { key: "pentakly", cz: "pentaklů", czGen: "Pentakl", symbol: "✪" },
];

const RANKS: [string, string][] = [
  ["eso", "Eso"],
  ["dvojka", "Dvojka"],
  ["trojka", "Trojka"],
  ["ctyrka", "Čtyřka"],
  ["petka", "Pětka"],
  ["sestka", "Šestka"],
  ["sedmicka", "Sedmička"],
  ["osmicka", "Osmička"],
  ["devitka", "Devítka"],
  ["desitka", "Desítka"],
  ["paze", "Páže"],
  ["rytir", "Rytíř"],
  ["kralovna", "Královna"],
  ["kral", "Král"],
];

function buildDeck(): Card[] {
  const deck: Card[] = MAJORS.map(([id, name, symbol]) => ({
    id,
    name,
    arcana: "major",
    symbol,
  }));
  for (const suit of SUITS) {
    for (const [rankSlug, rankCz] of RANKS) {
      deck.push({
        id: `${rankSlug}-${suit.key}`,
        name: `${rankCz} ${suit.cz}`,
        arcana: "minor",
        suit: suit.key,
        rank: rankSlug,
        symbol: suit.symbol,
      });
    }
  }
  return deck; // 22 + 56 = 78
}

export const DECK: Card[] = buildDeck();

export const CARD_BY_ID: Record<string, Card> = Object.fromEntries(
  DECK.map((c) => [c.id, c])
);

export function relatedCards(id: string): Card[] {
  // 3 související karty: deterministicky podle pozice v balíčku
  const i = DECK.findIndex((c) => c.id === id);
  if (i < 0) return DECK.slice(0, 3);
  return [DECK[(i + 7) % 78], DECK[(i + 21) % 78], DECK[(i + 40) % 78]];
}
