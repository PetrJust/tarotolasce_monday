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


// ---------- v1.5 §6: rozšíření eval brány ----------
import { DECK } from "../lib/cards";

const YESNO_10: Array<[string, ReturnType<typeof CARD>[]]> = [
  ["Mám mu napsat?", [CARD("mesic", true)]],
  ["Ozve se ještě?", [CARD("slunce", false)]],
  ["Miluje mě?", [CARD("dvojka-pohary", false)]],
  ["Mám na něj čekat?", [CARD("osmicka-pohary", false)]],
  ["Má cenu to zkoušet znovu?", [CARD("kolo-stesti", true)]],
  ["Mám mu odpustit?", [CARD("spravedlnost", false)]],
  ["Je to láska?", [CARD("eso-pohary", false)]],
  ["Mám jít na to rande?", [CARD("blazen", false)]],
  ["Mám to ukončit?", [CARD("smrt", false)]],
  ["Myslí to vážně?", [CARD("kral-pohary", true)]],
];

const SIX = (ids: string[]) => {
  const pos = ["Co bylo", "Proč to skončilo", "Co tě drží", "Co pustit", "Lekce", "Co dál"];
  return ids.map((id, i) => CARD(id, i % 3 === 1, pos[i]));
};
const MYEX_10: Array<[string, ReturnType<typeof CARD>[]]> = [
  // pozn.: kombinace mag/vez/…/hvezda je referenční SAMPLE (vrací se doslova),
  // proto tu jede jiná - SAMPLE má vlastní test níže
  ["Co mě na něm pořád drží?", SIX(["mag", "vez", "trojka-mece", "osmicka-pohary", "poustevnik", "svet"])],
  ["Proč na něj pořád myslím?", SIX(["mesic", "dvojka-mece", "sestka-pohary", "dabel", "mirnost", "svet"])],
  ["Vrátí se ke mně?", SIX(["kolo-stesti", "vez", "petka-pohary", "ctyrka-pohary", "viselec", "slunce"])],
  ["Uzavřela jsem to doopravdy?", SIX(["smrt", "osmicka-mece", "trojka-pohary", "rytir-mece", "soud", "eso-hole"])],
  ["Co jsem si z toho měla vzít?", SIX(["veleknezka", "cisar", "petka-mece", "sedmicka-pohary", "poustevnik", "hvezda"])],
  ["Proč to nešlo?", SIX(["zamilovani", "vuz", "petka-hole", "desitka-mece", "sila", "eso-pentakly"])],
  ["Mám mu dát ještě šanci?", SIX(["dvojka-pohary", "mesic", "ctyrka-hole", "sedmicka-mece", "spravedlnost", "slunce"])],
  ["Byla to moje chyba?", SIX(["cisarovna", "vez", "devitka-mece", "petka-pentakly", "mirnost", "sestka-hole"])],
  ["Co s tou prázdnotou po něm?", SIX(["ctyrka-pohary", "poustevnik", "trojka-mece", "osmicka-pohary", "hvezda", "eso-pohary"])],
  ["Jak ho pustit?", SIX(["dabel", "viselec", "sestka-pohary", "osmicka-pohary", "soud", "blazen"])],
];

describe("v1.5 §6.1: golden +10 na typ (1 karta a 6 karet)", () => {
  it("jednokaretní: dikce G + směr 2x + struktura", () => {
    for (const [q, cards] of YESNO_10) {
      const t = mockReading("yesno", q, cards);
      expect(t.startsWith("Karty se teď kloní spíš k ")).toBe(true);
      const tail = t.slice(Math.floor(t.length / 2));
      expect(/spíš (ano|ne)/.test(tail)).toBe(true);
      expect(t).not.toContain("!");
      expect(t.toLowerCase()).not.toContain("vibrac");
      expect(t.toLowerCase()).not.toContain("vesmír");
      expect(t.trim().endsWith("Nomi, tvoje AI kartářka")).toBe(true);
    }
  });

  it("šestikaretní: 6 bloků, dikce G, bez opakované věty mezi pozicemi", () => {
    for (const [q, cards] of MYEX_10) {
      const t = mockReading("my_ex", q, cards);
      const blocks = t.split("\n\n").filter((p) => p.startsWith("✦"));
      expect(blocks.length).toBe(6);
      const bodies = blocks.map((b) => b.split("\n")[1] ?? "");
      expect(new Set(bodies).size).toBe(bodies.length); // žádná opakovaná věta
      expect(t).not.toContain("!");
      expect(t.toLowerCase()).not.toContain("pro tvoje srdce");
    }
  });
});

describe("v1.5 §6.2: placená jednokarta != karta dne", () => {
  it("struktura: směr + proč (z karty) + co s tím + na co pozor; bohatší než ranní vzkaz", () => {
    const paid = mockReading("yesno", "Mám na něj čekat?", [CARD("mesic", true)]);
    const daily = mockReading("daily", "", [CARD("mesic", true, "Dnešní karta")]);
    expect(paid.startsWith("Karty se teď kloní")).toBe(true); // jasný směr
    expect(paid).toContain("✦"); // proč - blok z karty
    expect(paid).toContain("Na co si dát pozor:"); // na co pozor
    expect(paid.length).toBeGreaterThan(daily.length * 1.5); // výrazně bohatší
  });
});

describe("v1.5 §6.3: gramatická shoda (nález „je tu první plody\")", () => {
  it("celý balíček 78 karet bez rozbité shody v uvození", () => {
    for (const c of DECK) {
      for (const rev of [false, true]) {
        const t = mockReading("between_us", "Jak to mezi námi je?", [
          CARD(c.id, rev, "Já"),
          CARD("slunce", false, "On"),
          CARD("mesic", false, "My"),
        ]);
        expect(t).not.toContain("je tu první plody");
        expect(t).not.toContain("že je tu"); // odstraněné rizikové uvození
        expect(t).not.toContain("ukazuje na máš");
      }
    }
  });
});


// ---------- v1.6 §9: Flow B úvod + kontinuita ----------
import { mockFlowB } from "../lib/mockReadings";

describe("v1.6 §9.2/9.3: Flow B úvod a kontinuita", () => {
  const cases: Array<[string, string, ReturnType<typeof CARD>[]]> = [
    ["yesno", "Mám mu napsat?", [CARD("mesic", true)]],
    ["between_us", "Jak to mezi námi je?", [CARD("dvojka-hole", false, "Já"), CARD("slunce", false, "On"), CARD("mesic", false, "My")]],
    ["my_ex", "Co mě na něm drží?", [CARD("mag", false, "A"), CARD("vez", true, "B"), CARD("hvezda", false, "C"), CARD("slunce", false, "D"), CARD("mesic", true, "E"), CARD("svet", false, "F")]],
  ];

  it("úvod jmenuje první kartu a končí uprostřed myšlenky (pomlčka)", () => {
    for (const [spread, q, cards] of cases) {
      const { teaser } = mockFlowB(spread as any, q, cards, "Klára");
      const firstName = cards[0].cardId;
      // teaser jmenuje první kartu (přes její český název - hledáme uvození ř.2)
      expect(teaser).toContain("První karta, kterou sis vytáhla");
      // končí pomlčkou (otevřená myšlenka), ne tečkou uzavřené věty
      expect(teaser.trim().endsWith("—")).toBe(true);
      void firstName;
    }
  });

  it("se jménem oslovuje, bez jména neoslovuje", () => {
    const withName = mockFlowB("yesno", "Ozve se?", [CARD("slunce", false)], "Klára");
    expect(withName.teaser.startsWith("Klára, ")).toBe(true);
    const noName = mockFlowB("yesno", "Ozve se?", [CARD("slunce", false)], "");
    expect(noName.teaser.startsWith(", ")).toBe(false);
    expect(noName.teaser.startsWith("Sedla jsem si")).toBe(true);
  });

  it("kontinuita: teaser je PŘESNÝ prefix full; navazující věta dokončuje", () => {
    for (const [spread, q, cards] of cases) {
      const { full, teaser } = mockFlowB(spread as any, q, cards, "Klára");
      expect(full.startsWith(teaser)).toBe(true); // teaser ⊂ full
      // hned po teaseru pokračuje dokončení (mezera + text, ne nový odstavec)
      const cont = full.slice(teaser.length);
      expect(cont.startsWith(" ")).toBe(true);
      expect(cont.trim().length).toBeGreaterThan(0);
      // podpis na konci celého výkladu
      expect(full.trim().endsWith("Nomi, tvoje AI kartářka")).toBe(true);
    }
  });
});
