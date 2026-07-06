import { describe, it, expect } from "vitest";
import { classify } from "@/lib/classifier";
import { moderate } from "@/lib/moderation";

// Akceptační kritérium 4: klasifikátor správně routuje 12 testovacích otázek
// (4 ex, 4 binární, 2 vztahové, 2 vágní).
describe("classifier: 12 testovacích otázek", () => {
  const cases: [string, string][] = [
    // 4x ex → my_ex
    ["Vrátí se mi ex?", "my_ex"],
    ["Pořád myslím na bývalého, co s tím?", "my_ex"],
    ["Proč mě opustil?", "my_ex"],
    ["Bolí mě ten rozchod, přejde to?", "my_ex"],
    // 4x binární → yesno
    ["Miluje mě?", "yesno"],
    ["Mám mu napsat?", "yesno"],
    ["Bude mi s ním dobře?", "yesno"],
    ["Stojí o mě doopravdy?", "yesno"],
    // 2x vztahové → between_us
    ["Jak to mezi námi teď doopravdy je?", "between_us"],
    [
      "Nevím, na čem s partnerem jsem, pořád se hádáme a nemluvíme spolu",
      "between_us",
    ],
    // 2x vágní → between_us (default)
    ["Nevím, co mám dělat se svým životem v lásce", "between_us"],
    ["Cítím se poslední dobou hrozně zmateně ohledně všeho", "between_us"],
  ];

  it.each(cases)("„%s\" → %s", (question, expected) => {
    expect(classify(question).spread).toBe(expected);
  });

  it("routuje přesně 4 / 4 / 4 napříč kategoriemi", () => {
    const counts = cases.reduce<Record<string, number>>((acc, [, spread]) => {
      acc[spread] = (acc[spread] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts.my_ex).toBe(4);
    expect(counts.yesno).toBe(4);
    expect(counts.between_us).toBe(4);
  });
});

describe("classifier: pořadí priorit (ex vyhrává nad binární)", () => {
  it("binárně vypadající otázka s ex-tématem jde do my_ex", () => {
    // začíná „vrátí" (binární vzor), ale obsahuje ex-téma → my_ex vyhrává
    expect(classify("Vrátí se mi bývalý?").spread).toBe("my_ex");
  });
});

describe("moderation: krizové scénáře", () => {
  const cases: [string, string][] = [
    ["Nemůžu bez něj žít, co mám dělat?", "crisis_a"],
    ["Nechci žít, má to ještě smysl?", "crisis_a"],
    ["Bojím se ho, když přijde domů opilý", "crisis_b"],
    ["Bije mě a já nevím, co dělat", "crisis_b"],
    ["Je mi 16 a líbí se mi kluk ze třídy", "crisis_c"],
    ["Chodím do deváté třídy a zamilovala jsem se", "crisis_c"],
    ["Miluje mě?", "ok"],
    ["Jak to mezi námi je?", "ok"],
  ];

  it.each(cases)("„%s\" → %s", (question, expected) => {
    expect(moderate(question)).toBe(expected);
  });
});
