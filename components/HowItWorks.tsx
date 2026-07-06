// „Jak to funguje" - tři kroky jako tři ilustrace ve stylu rubů karet
// (otázka → vějíř → výklad), pod každou jedna věta DOSLOVA (v1.3 §3.3,
// přetrvává z v1.2 §4). Styl rubu: plochá noční fialová + gold ornamentika
// (mystický motiv, gradient zakázán - invariant 3).
import { palette, tokens } from "@/lib/palette";

const NIGHT = palette.night.DEFAULT;
const GOLD = tokens.gold600;

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 120 160" width={120} height={160} style={{ maxWidth: "100%", height: "auto" }} className="h-40 w-auto drop-shadow-card" role="img" aria-hidden>
      <rect width="120" height="160" rx="10" fill={NIGHT} />
      <rect x="5" y="5" width="110" height="150" rx="7" fill="none" stroke={GOLD} strokeWidth="1.4" />
      <rect x="10" y="10" width="100" height="140" rx="5" fill="none" stroke={GOLD} strokeWidth="0.7" />
      {children}
    </svg>
  );
}

// Krok 1: otázka (otazník mezi hvězdami)
function IllustrationQuestion() {
  return (
    <Frame>
      <g stroke={GOLD} fill="none" strokeWidth="2.4" strokeLinecap="round">
        <path d="M46 60 a14 14 0 1 1 20 12 c-4 3 -6 5 -6 11" />
      </g>
      <circle cx="60" cy="96" r="2.6" fill={GOLD} />
      <g fill={GOLD} opacity="0.9">
        <path d="M32 42 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z" />
        <path d="M88 110 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z" />
        <circle cx="90" cy="46" r="1.6" />
        <circle cx="30" cy="116" r="1.6" />
      </g>
    </Frame>
  );
}

// Krok 2: vějíř (tři karty v oblouku)
function IllustrationFan() {
  return (
    <Frame>
      <g stroke={GOLD} fill={palette.night.soft} strokeWidth="1.3">
        <rect x="30" y="58" width="26" height="44" rx="4" transform="rotate(-16 43 80)" />
        <rect x="47" y="52" width="26" height="44" rx="4" />
        <rect x="64" y="58" width="26" height="44" rx="4" transform="rotate(16 77 80)" />
      </g>
      <g fill={GOLD} opacity="0.9">
        <circle cx="60" cy="74" r="2.4" />
        <path d="M60 118 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z" />
      </g>
    </Frame>
  );
}

// Krok 3: výklad (řádky textu pod hvězdou)
function IllustrationReading() {
  return (
    <Frame>
      <path d="M60 34 l2.4 6 6 2.4 -6 2.4 -2.4 6 -2.4 -6 -6 -2.4 6 -2.4 Z" fill={GOLD} />
      <g stroke={GOLD} strokeWidth="2" strokeLinecap="round" opacity="0.9">
        <line x1="30" y1="70" x2="90" y2="70" />
        <line x1="30" y1="84" x2="90" y2="84" />
        <line x1="30" y1="98" x2="78" y2="98" />
        <line x1="30" y1="112" x2="66" y2="112" />
      </g>
    </Frame>
  );
}

const STEPS = [
  { Illustration: IllustrationQuestion, text: "Polož otázku. Vlastními slovy, jak ti to přijde." },
  { Illustration: IllustrationFan, text: "Vyber si tři karty z vějíře. Nech se vést." },
  { Illustration: IllustrationReading, text: "Přečti si výklad. Osobní, ke tvé otázce, uložený navždy." },
];

export default function HowItWorks() {
  return (
    <div>
      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        {STEPS.map(({ Illustration, text }, i) => (
          <div key={i} className="flex flex-col items-center text-center">
            <Illustration />
            <p className="mt-4 max-w-[220px] text-body-dim">{text}</p>
          </div>
        ))}
      </div>
      {/* Garanční věta DOSLOVA (v1.3 §3.3) */}
      <p className="mt-8 text-center text-sm text-body-dim">
        Výklady generuje AI. Pokud ti první výklad nic nedá, napiš nám a
        29 Kč ti vrátíme.
      </p>
    </div>
  );
}
