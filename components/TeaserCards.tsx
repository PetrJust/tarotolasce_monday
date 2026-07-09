"use client";
// Karty v ochutnávce (Flow B, v1.6.1 §2). Rozložení jako ve výkladu:
//  - 1 karta  -> dominantní, na středu, ~62 % šířky (zamčená rubem)
//  - 3 karty  -> plná řada přes šířku (první otočená, zbytek zamčený)
//  - 6 karet  -> mřížka 2×3 přes šířku (první otočená, zbytek zamčený)
// §2.3: zamčené karty nesou jemný zámeček; klepnutí = jemný shake + scroll
// k odemykacímu bloku (žádný modal). §2.4: klepnutí na otočenou kartu
// otevře detail s návratem.
import { useState } from "react";
import { CARD_BY_ID } from "@/lib/cards";
import { CardBack, CardFace } from "@/components/TarotCard";
import CardDetail, { CardDetailData } from "@/components/CardDetail";

export type TeaserCardItem = {
  cardId: string;
  name: string;
  reversed: boolean;
  position?: string;
};

function LockBadge() {
  // decentní zámeček v rohu karty (soft-gold na tmavém rubu)
  return (
    <span
      className="pointer-events-none absolute right-1.5 top-1.5 rounded-full bg-plum-900/70 p-1"
      aria-hidden
    >
      <svg viewBox="0 0 12 12" width="10" height="10">
        <rect x="2.5" y="5" width="7" height="5" rx="1.2" fill="#D4AF37" />
        <path
          d="M4 5 V3.6 a2 2 0 0 1 4 0 V5"
          fill="none"
          stroke="#D4AF37"
          strokeWidth="1.3"
        />
      </svg>
    </span>
  );
}

export default function TeaserCards({
  cards,
  unlockAnchorId,
}: {
  cards: TeaserCardItem[];
  unlockAnchorId: string;
}) {
  const [detail, setDetail] = useState<CardDetailData | null>(null);
  const [shaking, setShaking] = useState<number | null>(null);
  const n = cards.length;
  const revealFirst = n > 1; // jednokaretní: ani ta jediná se neukáže

  const wrap =
    n === 1
      ? "mt-2 flex justify-center"
      : "mt-2 grid w-full grid-cols-3 gap-2 sm:gap-3";
  const cell = n === 1 ? "w-[62%] max-w-[240px]" : "w-full";

  function onLockedTap(i: number) {
    // jemný hint + scroll k odemykacímu bloku (v1.6.1 §2.3)
    setShaking(i);
    setTimeout(() => setShaking(null), 450);
    document
      .getElementById(unlockAnchorId)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <>
      <div className={wrap}>
        {cards.map((c, i) => {
          const flipped = revealFirst && i === 0;
          return (
            <div key={c.cardId + i} className={`${cell} text-center`}>
              {flipped ? (
                <button
                  type="button"
                  onClick={() =>
                    // V ochutnávce se orientace neprozrazuje (reversed až
                    // po zaplacení) - detail ukazuje kartu normálně.
                    setDetail({ cardId: c.cardId, name: c.name, reversed: false })
                  }
                  className="block w-full cursor-pointer"
                  aria-label={`Detail karty ${c.name}`}
                >
                  {CARD_BY_ID[c.cardId] ? (
                    <CardFace
                      card={CARD_BY_ID[c.cardId]}
                      reversed={false}
                      className="aspect-[74/112] w-full drop-shadow-card"
                    />
                  ) : (
                    <CardBack className="aspect-[74/112] w-full drop-shadow-card" />
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onLockedTap(i)}
                  className={`relative block w-full cursor-pointer ${
                    shaking === i ? "tol-shake" : ""
                  }`}
                  aria-label="Karta se odemkne po zaplacení"
                >
                  <CardBack className="aspect-[74/112] w-full drop-shadow-card" />
                  <LockBadge />
                </button>
              )}
            </div>
          );
        })}
      </div>
      {detail && <CardDetail card={detail} onClose={() => setDetail(null)} />}
    </>
  );
}
