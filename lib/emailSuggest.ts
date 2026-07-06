// Našeptávač domén + korekce překlepů (v1 §3.3.2, v1.1 B.1).
const TYPOS: Record<string, string> = {
  "gmial.com": "gmail.com", "gmal.com": "gmail.com", "gamil.com": "gmail.com",
  "gmail.cz": "gmail.com", "semzam.cz": "seznam.cz", "seznma.cz": "seznam.cz",
  "sezam.cz": "seznam.cz", "centurm.cz": "centrum.cz",
};
const KNOWN = ["seznam.cz", "email.cz", "gmail.com", "centrum.cz", "atlas.cz"];

export function emailSuggestion(email: string): string | null {
  const at = email.indexOf("@");
  if (at < 1) return null;
  const local = email.slice(0, at);
  const dom = email.slice(at + 1).toLowerCase();
  if (TYPOS[dom]) return `${local}@${TYPOS[dom]}`;
  if (dom && !dom.includes(".")) {
    const hit = KNOWN.find((k) => k.startsWith(dom));
    if (hit) return `${local}@${hit}`;
  }
  return null;
}
