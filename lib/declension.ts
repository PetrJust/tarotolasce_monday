// České skloňování: 1 / 2 až 4 / 5+
export function vykladu(n: number): string {
  if (n === 1) return "zbývá 1 výklad";
  if (n >= 2 && n <= 4) return `zbývají ${n} výklady`;
  return `zbývá ${n} výkladů`;
}

export function vyberKaret(n: number): string {
  if (n === 1) return "Vyber 1 kartu. Nech se vést.";
  if (n >= 2 && n <= 4) return `Vyber ${n} karty. Nech se vést.`;
  return `Vyber ${n} karet. Nech se vést.`;
}

export function pocetVykladu(n: number): string {
  if (n === 1) return "1 výklad";
  if (n >= 2 && n <= 4) return `${n} výklady`;
  return `${n} výkladů`;
}
