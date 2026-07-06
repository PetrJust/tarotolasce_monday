import { describe, it, expect } from "vitest";
import { vykladu, vyberKaret, pocetVykladu } from "@/lib/declension";

// Akceptační kritérium 6: skloňování pro 1 / 2 až 4 / 5+.
describe("skloňování zůstatku výkladů", () => {
  it("1 výklad", () => {
    expect(vykladu(1)).toBe("zbývá 1 výklad");
  });
  it("2 až 4 výklady", () => {
    expect(vykladu(2)).toBe("zbývají 2 výklady");
    expect(vykladu(4)).toBe("zbývají 4 výklady");
  });
  it("5+ výkladů", () => {
    expect(vykladu(5)).toBe("zbývá 5 výkladů");
    expect(vykladu(20)).toBe("zbývá 20 výkladů");
  });
});

describe("skloňování výběru karet", () => {
  it("1 kartu / 3 karty / 6 karet", () => {
    expect(vyberKaret(1)).toContain("Vyber 1 kartu");
    expect(vyberKaret(3)).toContain("Vyber 3 karty");
    expect(vyberKaret(6)).toContain("Vyber 6 karet");
  });
});

describe("pocetVykladu", () => {
  it("tvary 1 / 2-4 / 5+", () => {
    expect(pocetVykladu(1)).toBe("1 výklad");
    expect(pocetVykladu(3)).toBe("3 výklady");
    expect(pocetVykladu(5)).toBe("5 výkladů");
  });
});
