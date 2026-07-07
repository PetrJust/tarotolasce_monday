"use client";
// Rub karty: vlastní brand design. Líce: placeholder v RWS duchu.
// KONVENCE ASSETŮ (v1 §9): reálné ilustrace se nahrají do /public/cards/
// jako {slug}.webp + back.webp. Komponenty je zkusí načíst a při chybějícím
// souboru elegantně spadnou na SVG placeholder -> žádné bílé obdélníky,
// nahrání assetů nevyžaduje zásah do kódu.
import { useState } from "react";
import { Card } from "@/lib/cards";
import { palette, tokens } from "@/lib/palette";
import { heartPath } from "@/components/LogoSymbol";

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
  return (
    <svg
      viewBox="0 0 120 200"
      // Obranná záloha: intrinsic rozměry, kdyby Tailwind třídy z nějakého
      // důvodu nenaskočily (viz v1.3 hotfix) - SVG spadne na malý pevný
      // rozměr místo roztažení na celou šířku viewportu.
      width={120}
      height={200}
      style={{ maxWidth: "100%", height: "auto" }}
      className={className}
      role="img"
      aria-label="Rub karty"
    >
      {/* v1.6 §3: SRDCOVÝ rub. Žádný gradient -
          plochá noční fialová, soft-gold rám, srdce uprostřed.
          (Monogram z dřívějška zrušen.) */}
      <rect width="120" height="200" rx="10" fill={palette.night.DEFAULT} />
      <rect x="5" y="5" width="110" height="190" rx="7" fill="none" stroke={tokens.softGold} strokeWidth="1.4" />
      <rect x="10" y="10" width="100" height="180" rx="5" fill="none" stroke={tokens.softGold} strokeWidth="0.7" />
      {/* Centrální srdce (heartPath ze sdíleného loga) */}
      <path d={heartPath(60, 100, 60)} fill={tokens.romanticPink} />
      <path d={heartPath(60, 100, 60)} fill="none" stroke={tokens.softGold} strokeWidth="1.4" />
      <path d={heartPath(60, 100, 40)} fill="none" stroke={tokens.softGold} strokeWidth="0.7" opacity="0.8" />
      {/* Malá srdíčka v rozích */}
      <g opacity="0.85">
        {[
          [22, 30],
          [98, 30],
          [22, 170],
          [98, 170],
        ].map(([x, y], i) => (
          <path key={i} d={heartPath(x, y, 12)} fill={tokens.softGold} />
        ))}
      </g>
      {/* Tečkovaný geometrický rastr (decentní) */}
      <g fill={tokens.softGold} opacity="0.4">
        {Array.from({ length: 5 }).map((_, r) =>
          Array.from({ length: 3 }).map((_, c) => (
            <circle key={`${r}-${c}`} cx={36 + c * 24} cy={48 + r * 26} r="0.8" />
          ))
        )}
      </g>
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
