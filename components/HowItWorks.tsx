// „Jak to funguje" (v1.5 §5.4): TŘI ŘÁDKY POD SEBOU - malá ikonka karty
// vlevo (~24 px, ne ilustrace) + tučný titulek + jedna věta; celá sekce
// v jednom viewportu na 380 px. Texty kroků 1 a 3 [HOTOVO] beze změny,
// krok 2 DOSLOVA dle zadání. Ikony z tokens v3 (soft-gold jen mystický
// motiv na deep-plum kartičce).
import { palette, tokens } from "@/lib/palette";

const NIGHT = palette.night.DEFAULT;
const GOLD = tokens.softGold;

function CardIcon({ children }: { children?: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden className="mt-0.5 shrink-0">
      <rect x="5" y="2" width="14" height="20" rx="2.5" fill={NIGHT} />
      <rect x="6.6" y="3.6" width="10.8" height="16.8" rx="1.6" fill="none" stroke={GOLD} strokeWidth="0.9" />
      {children}
    </svg>
  );
}

const IconQuestion = () => (
  <CardIcon>
    <path
      d="M10.2 9.4a1.9 1.9 0 1 1 2.7 1.7c-.6.3-.9.7-.9 1.4"
      stroke={GOLD} strokeWidth="1.1" fill="none" strokeLinecap="round"
    />
    <circle cx="12" cy="15.4" r="0.9" fill={GOLD} />
  </CardIcon>
);
const IconFan = () => (
  <CardIcon>
    <g stroke={GOLD} strokeWidth="0.9" fill="none">
      <rect x="8.4" y="8" width="4.4" height="7" rx="1" transform="rotate(-14 10.6 11.5)" />
      <rect x="9.8" y="7.4" width="4.4" height="7" rx="1" />
      <rect x="11.2" y="8" width="4.4" height="7" rx="1" transform="rotate(14 13.4 11.5)" />
    </g>
    <circle cx="12" cy="17.6" r="0.8" fill={GOLD} />
  </CardIcon>
);
const IconReading = () => (
  <CardIcon>
    <path d="M12 5.6l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7z" fill={GOLD} />
    <g stroke={GOLD} strokeWidth="1" strokeLinecap="round">
      <line x1="8.6" y1="13" x2="15.4" y2="13" />
      <line x1="8.6" y1="15.4" x2="15.4" y2="15.4" />
      <line x1="8.6" y1="17.8" x2="13.2" y2="17.8" />
    </g>
  </CardIcon>
);

const STEPS = [
  {
    Icon: IconQuestion,
    title: "Polož otázku.",
    text: "Vlastními slovy, jak ti to přijde.",
  },
  {
    // v1.5 §5.4 DOSLOVA
    Icon: IconFan,
    title: "Vyber si karty z vějíře.",
    text: "Kolik jich bude — jedna, tři, nebo šest — pozná Nomi z tvé otázky.",
  },
  {
    Icon: IconReading,
    title: "Přečti si výklad.",
    text: "Osobní, ke tvé otázce, uložený navždy.",
  },
];

export default function HowItWorks() {
  return (
    <div>
      <div className="mt-5 space-y-4">
        {STEPS.map(({ Icon, title, text }, i) => (
          <div key={i} className="flex items-start gap-3">
            <Icon />
            <p className="text-body-dim">
              <strong className="text-body">{title}</strong> {text}
            </p>
          </div>
        ))}
      </div>
      {/* Garanční věta DOSLOVA (beze změny) */}
      <p className="mt-6 text-sm text-body-dim">
        Výklady generuje AI. Pokud ti první výklad nic nedá, napiš nám a
        29 Kč ti vrátíme.
      </p>
    </div>
  );
}
