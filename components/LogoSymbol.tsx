// Logo symbol (v1.6 §3): karta se srdcem a soft-gold rámem = hlavní symbol
// značky. Použití ven: favicon, app ikona, avatary, Stories badge, OG.
// PŘESNÝ přepis oficiálního public/logo/symbol.svg dodaného zakladatelem
// (viewBox 120×168, tokens v3: deep-plum #2B1340 + soft-gold #D4AF37;
// audit čistý). Monogram TOL zrušen. Symbol nezaměnitelný s logem SPIRIO.

export default function LogoSymbol({
  className = "",
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 120 168"
      width={size}
      height={Math.round((size * 168) / 120)}
      style={{ maxWidth: "100%", height: "auto" }}
      className={className}
      role="img"
      aria-label="Tarot o Lásce"
    >
      {/* tělo karty */}
      <rect fill="#2B1340" x="2" y="2" width="116" height="164" rx="14" />
      {/* zlatý vnitřní rámeček */}
      <rect fill="none" stroke="#D4AF37" x="10" y="10" width="100" height="148" rx="9" strokeWidth="2.5" />
      {/* hvězdička nahoře */}
      <path fill="#D4AF37" d="M60 24 l2.8 6.4 6.4 2.8 -6.4 2.8 -2.8 6.4 -2.8 -6.4 -6.4 -2.8 6.4 -2.8 z" />
      {/* srdce (romantic-pink, ladí s akcenty appky) */}
      <path
        fill="#E84D9A"
        stroke="#F6BBD9"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M60 116 C 38 98, 30 84, 30 72 C 30 60, 39 52, 49 52 C 55 52, 59 55, 60 60 C 61 55, 65 52, 71 52 C 81 52, 90 60, 90 72 C 90 84, 82 98, 60 116 Z"
      />
      {/* hvězdička dole */}
      <path fill="#D4AF37" d="M60 130 l2.2 5 5 2.2 -5 2.2 -2.2 5 -2.2 -5 -5 -2.2 5 -2.2 z" />
    </svg>
  );
}
