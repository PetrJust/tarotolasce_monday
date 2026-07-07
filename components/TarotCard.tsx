"use client";
// Rub karty: vlastní brand design. Líce: placeholder v RWS duchu.
// KONVENCE ASSETŮ (v1 §9): reálné ilustrace se nahrají do /public/cards/
// jako {slug}.webp + back.webp. Komponenty je zkusí načíst a při chybějícím
// souboru elegantně spadnou na SVG placeholder -> žádné bílé obdélníky,
// nahrání assetů nevyžaduje zásah do kódu.
import { useState } from "react";
import { Card } from "@/lib/cards";
import { palette, tokens } from "@/lib/palette";

export function CardBack({ className = "" }: { className?: string }) {
  const [imgOk, setImgOk] = useState(true);
  if (imgOk) {
    return (
      <span className={`relative block ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/cards/back.webp"
          alt="Rub karty"
          className="h-full w-full rounded-[8%] object-cover"
          onError={() => setImgOk(false)}
          draggable={false}
        />
      </span>
    );
  }
  return <CardBackSvg className={className} />;
}

function CardBackSvg({ className = "" }: { className?: string }) {
  // OFICIÁLNÍ rub karty (v1.6 §3, dodáno zakladatelem: public/logo/
  // rub-karty.svg). Barvy jsou z tokens v3 (deep-plum #2B1340 + soft-gold
  // #D4AF37), audit čistý. Paths jsou 1:1 přepisem schváleného SVG - žádná
  // vlastní kresba (dřívější kódem generovaný rub nahrazen).
  return (
    <svg
      viewBox="0 0 200 320"
      // Obranná záloha: intrinsic rozměry, kdyby Tailwind třídy nenaskočily
      width={200}
      height={320}
      style={{ maxWidth: "100%", height: "auto" }}
      className={className}
      role="img"
      aria-label="Rub karty"
    >
      <rect fill="var(--tok-deep-plum, #2B1340)" x="3" y="3" width="194" height="314" rx="16" />
      <rect fill="none" stroke="var(--tok-soft-gold, #D4AF37)" strokeWidth="2" x="12" y="12" width="176" height="296" rx="11" />
      <rect fill="none" stroke="var(--tok-soft-gold, #D4AF37)" strokeWidth="1" x="18" y="18" width="164" height="284" rx="8" opacity="0.6" />
      {/* hvězdy nahoře a dole + tečky v rozích */}
      <path fill="var(--tok-soft-gold, #D4AF37)" d="M100 40 l3.5 8 8 3.5 -8 3.5 -3.5 8 -3.5 -8 -8 -3.5 8 -3.5 z" />
      <path fill="var(--tok-soft-gold, #D4AF37)" d="M100 258 l3.5 8 8 3.5 -8 3.5 -3.5 8 -3.5 -8 -8 -3.5 8 -3.5 z" />
      <circle fill="var(--tok-soft-gold, #D4AF37)" cx="40" cy="46" r="2.2" />
      <circle fill="var(--tok-soft-gold, #D4AF37)" cx="160" cy="46" r="2.2" />
      <circle fill="var(--tok-soft-gold, #D4AF37)" cx="40" cy="274" r="2.2" />
      <circle fill="var(--tok-soft-gold, #D4AF37)" cx="160" cy="274" r="2.2" />
      {/* centrální srdce (romantic-pink, ladí s akcenty appky) */}
      <path
        fill="var(--tok-romantic-pink, #E84D9A)"
        stroke="var(--tok-accent-dim, #F6BBD9)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M100 196 C 66 168, 54 146, 54 128 C 54 110, 68 98, 83 98 C 92 98, 98 103, 100 110 C 102 103, 108 98, 117 98 C 132 98, 146 110, 146 128 C 146 146, 134 168, 100 196 Z"
      />
    </svg>
  );
}

export function CardFace(props: {
  card: Card;
  reversed?: boolean;
  className?: string;
}) {
  const { card, className = "" } = props;
  const [imgOk, setImgOk] = useState(true);
  if (imgOk) {
    return (
      <span className={`relative block ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/cards/${card.id}.webp`}
          alt={card.name}
          className="h-full w-full rounded-[8%] object-cover"
          onError={() => setImgOk(false)}
          draggable={false}
        />
      </span>
    );
  }
  return <CardFaceSvg {...props} />;
}

function CardFaceSvg({
  card,
  reversed = false,
  className = "",
}: {
  card: Pick<Card, "name" | "symbol">;
  reversed?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 200"
      width={120}
      height={200}
      style={{ maxWidth: "100%", height: "auto" }}
      className={className}
      role="img"
      aria-label={`${card.name}${reversed ? ", obráceně" : ""}`}
    >
      <rect width="120" height="200" rx="10" fill={palette.cream.DEFAULT} />
      <rect x="6" y="6" width="108" height="188" rx="7" fill="none" stroke={palette.night.DEFAULT} strokeWidth="1.6" />
      <rect x="11" y="11" width="98" height="178" rx="4" fill="none" stroke={tokens.softGold} strokeWidth="1" />
      <g transform={reversed ? "rotate(180 60 100)" : undefined}>
        <text
          x="60"
          y="118"
          textAnchor="middle"
          fontSize="44"
          fill={palette.night.soft}
        >
          {card.symbol}
        </text>
        <text
          x="60"
          y="176"
          textAnchor="middle"
          fontSize="11"
          fontFamily="serif"
          fill={palette.night.DEFAULT}
        >
          {card.name.length > 16 ? card.name.slice(0, 15) + "…" : card.name}
        </text>
        <line x1="28" y1="160" x2="92" y2="160" stroke={tokens.softGold} strokeWidth="0.8" />
      </g>
    </svg>
  );
}
