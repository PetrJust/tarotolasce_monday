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

// ---------- dikce G (v1.1) ----------
// Sada různorodých vstupů, na které se pravidla dikce aplikují plošně.
const G_INPUTS: Array<[Parameters<typeof mockReading>[0], string, ReturnType<typeof CARD>[]]> = [
  ["between_us", "Jak to mezi námi je?", THREE],
  ["yesno", "Mám mu napsat?", [CARD("vez", true)]],
  ["yesno", "Ozve se ještě?", [CARD("slunce", false)]],
  ["my_ex", "Co mě na něm pořád drží?", [
    CARD("mag", false, "Co bylo"),
    CARD("vez", false, "Proč to skončilo"),
    CARD("trojka-mece", false, "Co tě drží"),
    CARD("osmicka-pohary", false, "Co pustit"),
    CARD("poustevnik", false, "Lekce"),
    CARD("hvezda", false, "Co dál"),
  ]],
  ["daily", "", [CARD("slunce", false, "Dnešní karta")]],
];

describe("dikce G (v1.1): zákazy a stavba", () => {
  it("žádné vibrace, vesmír, vykřičníky, inverzní vzory", () => {
    for (const [spread, q, cards] of G_INPUTS) {
      const t = mockReading(spread, q, cards);
      expect(t.toLowerCase()).not.toContain("vibrac");
      expect(t.toLowerCase()).not.toContain("vesmír");
      expect(t).not.toContain("!");
      // inverzní básnické vzory zakázané výslovně zadáním
      expect(t).not.toContain("Nevyřčená zůstala");
      expect(t).not.toContain("v poháru až po okraj");
    }
  });

  it("blok karty má aspoň 2 věty a váže se na otázku (H.4)", () => {
    const t = mockReading("between_us", "Ozve se mi ještě?", THREE);
    const blocks = t.split("\n\n").filter((p) => p.startsWith("✦"));
    expect(blocks.length).toBe(3);
    for (const b of blocks) {
      const body = b.split("\n")[1] ?? "";
      const sentences = body.match(/[^.!?]+[.!?]/g) ?? [];
      expect(sentences.length).toBeGreaterThanOrEqual(2);
    }
    // vazba na téma otázky (ozve se -> čekání na jeho krok)
    expect(t).toContain("jestli se ozve");
  });

  it("ano/ne: směr zopakovaný i v závěru, ne jen v úvodu (checklist)", () => {
    const yes = mockReading("yesno", "Miluje mě?", [CARD("slunce", false)]);
    expect(yes.startsWith("Karty se teď kloní spíš k ano.")).toBe(true);
    const yesTail = yes.slice(Math.floor(yes.length / 2));
    expect(yesTail).toContain("spíš ano");

    const no = mockReading("yesno", "Mám mu napsat?", [CARD("mesic", true)]);
    expect(no.startsWith("Karty se teď kloní spíš k ne.")).toBe(true);
    const noTail = no.slice(Math.floor(no.length / 2));
    expect(noTail).toContain("spíš ne");
  });

  it("ukázky (SAMPLE_*) neobsahují zakázané vzory", () => {
    const samples = [
      mockReading("between_us", "Jak to mezi námi teď doopravdy je?", [
        CARD("dvojka-pohary", false, "Já"),
        CARD("rytir-pentakly", false, "On"),
        CARD("slunce", false, "My"),
      ]),
      mockReading("yesno", "Mám mu napsat?", [CARD("vez", true)]),
      mockReading("daily", "", [CARD("slunce", false, "Dnešní karta")]),
    ];
    for (const t of samples) {
      expect(t).not.toContain("Nevyřčená zůstala");
      expect(t).not.toContain("v poháru až po okraj");
      expect(t).not.toContain("!");
      expect(t).not.toContain("—");
    }
  });

  // v1.3 §3.11, pravidlo dikce 9: zákaz zdrobnělého oslovování pocitů.
  // Golden set přeměřen proti finálním ukázkám 3.4 (v1.3 §8).
  it("pravidlo 9: žádné zdrobnělé oslovování pocitů", () => {
    for (const [spread, q, cards] of G_INPUTS) {
      const t = mockReading(spread, q, cards).toLowerCase();
      expect(t).not.toContain("pro tvoje srdce");
      expect(t).not.toContain("pro tvou dušičku");
      expect(t).not.toContain("srdíčk");
      expect(t).not.toContain("dušičk");
    }
  });
});
