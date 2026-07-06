export type ModerationStatus = "ok" | "crisis_a" | "crisis_b" | "crisis_c";

// MOCK: replace with production (Haiku moderace)
const CRISIS_A = [
  "nemůžu bez něj žít",
  "nechci žít",
  "radši bych tu nebyla",
  "nemá to smysl",
  "ublížit si",
];
const CRISIS_B = ["bije mě", "bojím se ho", "uhodil", "nesmím nikam"];
const CRISIS_C = [
  "je mi 15", "je mi 16", "je mi 17",
  "chodím do deváté třídy",
  "střední škola a je mi",
];

export function moderate(question: string): ModerationStatus {
  const q = question.toLowerCase();
  if (CRISIS_A.some((k) => q.includes(k))) return "crisis_a";
  if (CRISIS_B.some((k) => q.includes(k))) return "crisis_b";
  if (CRISIS_C.some((k) => q.includes(k))) return "crisis_c";
  return "ok";
}
