export type SpreadKey = "daily" | "yesno" | "between_us" | "my_ex";

export type Spread = {
  key: SpreadKey;
  name: string;
  cardCount: number;
  positions: string[];
  paid: boolean;
};

export const SPREADS: Record<SpreadKey, Spread> = {
  daily: {
    key: "daily",
    name: "Karta dne",
    cardCount: 1,
    positions: ["Dnešní karta"],
    paid: false,
  },
  yesno: {
    key: "yesno",
    name: "Ano/Ne pro srdce",
    cardCount: 1,
    positions: ["Odpověď"],
    paid: true,
  },
  between_us: {
    key: "between_us",
    name: "Jak to mezi námi je",
    cardCount: 3,
    positions: ["Já", "On", "My"], // 2. pozice se přepisuje dle otázky
    paid: true,
  },
  my_ex: {
    key: "my_ex",
    name: "Já a můj ex",
    cardCount: 6,
    positions: [
      "Co zůstalo nevyřčené",
      "Proč se to stalo",
      "Co mě stále drží",
      "Co musím pustit",
      "Lekce",
      "Co mě čeká",
    ],
    paid: true,
  },
};

// Popisek 2. pozice „On“ / „Ona“ dle otázky, default „On“
export function betweenUsPositions(question: string): string[] {
  const q = question.toLowerCase();
  const feminine =
    /\bona\b|\bjí\b|\bji\b|partnerka|manželka|přítelkyně|holka|žena/.test(q);
  return ["Já", feminine ? "Ona" : "On", "My"];
}
