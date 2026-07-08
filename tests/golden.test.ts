// Golden set (zadání v1 §6.2, zjednodušeně pro mock engine):
// verzované otázky + automatické kontroly. Před úpravou promptu/enginu
// musí projít; při poklesu kvality build neprochází.
import { describe, it, expect } from "vitest";
import { mockReading, nGramOverlap } from "@/lib/mockReadings";

const CARD = (cardId: string, reversed = false, position = "Odpověď") => ({
  cardId,
  name: cardId,
  reversed,
  position,
});

const THREE = [
  CARD("dvojka-hole", false, "Já"),
  CARD("mesic", true, "On"),
  CARD("sestka-pohary", false, "My"),
];

describe("engine v2: struktura a pravidla (6.1)", () => {
  it("výklad má bloky karet s mini-nadpisy a podpis Nomi (6.1.10)", () => {
    const t = mockReading("between_us", "Jak to mezi námi je?", THREE);
    expect(t).toContain("✦");
    expect((t.match(/✦/g) ?? []).length).toBe(3);
    expect(t.trim().endsWith("Nomi, tvoje AI kartářka")).toBe(true);
  });

  it("ano/ne: směrová odpověď v první větě, disclaimer až potom (6.1.4)", () => {
    const yes = mockReading("yesno", "Miluje mě?", [CARD("slunce", false)]);
    expect(yes.startsWith("Karty se teď kloní spíš k ano.")).toBe(true);
    const no = mockReading("yesno", "Miluje mě?", [CARD("mesic", true)]);
    expect(no.startsWith("Karty se teď kloní spíš k ne.")).toBe(true);
    // disclaimer existuje, ale nesmí být první větou
    expect(no.indexOf("karty neznají budoucnost")).toBeGreaterThan(30);
  });

  it("časová otázka: žádné datum, laskavé přerámování (6.1.5)", () => {
    const t = mockReading("yesno", "Kdy se ozve?", [CARD("hvezda", false)]);
    expect(t).toContain("neumí odpovědět kalendářem");
    expect(t).not.toMatch(/\b(v lednu|do týdne|za měsíc|příští rok)\b/i);
  });

  it("obrácená karta má konkrétní význam, ne vatu (6.1.6)", () => {
    const t = mockReading("daily", "", [CARD("vez", true, "Dnešní karta")]);
    expect(t).toContain("obráceně");
    expect(t).not.toContain("zablokovaná energie");
  });

  it("mimo záběr (zdraví): přesměrování na odborníka (6.1.8)", () => {
    const t = mockReading("between_us", "Uzdraví se moje máma z nemoci?", THREE);
    expect(t).toContain("za lékařem");
  });

  it("mimo záběr (finance): přesměrování na odborníka (6.1.8)", () => {
    const t = mockReading("yesno", "Mám investovat do akcií?", [CARD("mag", false)]);
    expect(t).toContain("odborníka");
    // směrová odpověď zůstává i tak
    expect(t).toContain("Karty se teď kloní");
  });

  it("žádné predikce a dlouhé pomlčky (globální pravidla)", () => {
    const inputs: Array<[string, ReturnType<typeof CARD>[]]> = [
      ["Vrátí se mi?", [CARD("dabel", true)]],
      ["Jak to mezi námi je?", THREE],
    ];
    for (const [q, cards] of inputs) {
      const t = mockReading(cards.length === 1 ? "yesno" : "between_us", q, cards);
      expect(t).not.toContain("vrátí se ti");
      expect(t).not.toContain("—");
    }
  });

  it("různé vstupy nesdílejí šablonu nad práh (6.2 overlap)", () => {
    const a = mockReading("between_us", "Jak to mezi námi je?", THREE);
    const b = mockReading("between_us", "Máme spolu budoucnost?", [
      CARD("kral-mece", false, "Já"),
      CARD("petka-pohary", true, "Ona"),
      CARD("svet", false, "My"),
    ]);
    expect(nGramOverlap(a, b)).toBeLessThan(0.5);
  });
});
