import { describe, it, expect } from "vitest";
import {
  createSession,
  getSession,
  pickCard,
  unpickCard,
} from "@/lib/sessions";
import { DECK } from "@/lib/cards";

describe("balíček karet", () => {
  it("má přesně 78 unikátních karet", () => {
    expect(DECK).toHaveLength(78);
    expect(new Set(DECK.map((c) => c.id)).size).toBe(78);
  });
});

describe("serverové míchání", () => {
  it("stejná session = stejné pořadí (deterministická rekonstrukce)", () => {
    const s = createSession("my_ex");
    const a = s.order.map((c) => c.card.id).join(",");
    const b = getSession(s.id)!.order.map((c) => c.card.id).join(",");
    expect(a).toBe(b);
  });

  it("rekonstruuje správný rozklad z id i bez uložené session", () => {
    const s = createSession("my_ex");
    // simulace „čerstvého" serveru: id nese rozklad (s.{spread}....)
    expect(getSession(s.id)!.spread).toBe("my_ex");
  });

  it("my_ex (podtržítko v klíči) jde vybrat všech 6 karet i po rekonstrukci", () => {
    const s = createSession("my_ex");
    // vynutíme rekonstrukci čerstvým id ve formátu s.{spread}.…
    const freshId = "s.my_ex.aaa.bbb";
    expect(getSession(freshId)!.spread).toBe("my_ex");
    let ok = 0;
    for (const i of [3, 9, 15, 21, 27, 33]) if (pickCard(freshId, i)) ok++;
    expect(ok).toBe(6);
    // sedmá už ne
    expect(pickCard(freshId, 40)).toBeNull();
  });

  it("reversed se blíží 27 % napříč mnoha sessions", () => {
    let reversed = 0;
    let total = 0;
    for (let i = 0; i < 300; i++) {
      const t = createSession("between_us");
      reversed += t.order.filter((c) => c.reversed).length;
      total += 78;
    }
    const rate = reversed / total;
    // tolerance kvůli náhodě; cílová hodnota 0,27
    expect(rate).toBeGreaterThan(0.22);
    expect(rate).toBeLessThan(0.32);
  });
});

describe("výběr karet", () => {
  it("vrací kartu a deduplikuje stejný index", () => {
    const s = createSession("between_us");
    expect(pickCard(s.id, 5)).not.toBeNull();
    expect(pickCard(s.id, 5)).toBeNull(); // duplicitní index
  });

  it("nepřekročí počet karet rozkladu", () => {
    const s = createSession("between_us"); // 3 karty
    expect(pickCard(s.id, 1)).not.toBeNull();
    expect(pickCard(s.id, 2)).not.toBeNull();
    expect(pickCard(s.id, 3)).not.toBeNull();
    expect(pickCard(s.id, 4)).toBeNull(); // 4. už ne
  });

  it("odmítne index mimo rozsah", () => {
    const s = createSession("yesno");
    expect(pickCard(s.id, -1)).toBeNull();
    expect(pickCard(s.id, 78)).toBeNull();
  });

  it("krok zpět uvolní výběr a umožní znovu vybrat", () => {
    const s = createSession("between_us");
    pickCard(s.id, 10);
    pickCard(s.id, 11);
    expect(unpickCard(s.id, 10)!.ok).toBe(true);
    // po uvolnění lze vybrat jinou kartu, počet zůstává v limitu
    expect(pickCard(s.id, 12)).not.toBeNull();
    expect(pickCard(s.id, 13)).not.toBeNull();
    expect(pickCard(s.id, 14)).toBeNull(); // znovu na limitu 3
  });

  it("unpick neexistujícího výběru vrací null", () => {
    const s = createSession("between_us");
    expect(unpickCard(s.id, 50)).toBeNull();
  });
});
