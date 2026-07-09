"use client";
// Zobrazení vytažených karet ve výkladu (placený výklad + detail v
// historii). Rozložení dle v1.6.1 §2:
//  - 1 karta  -> dominantní, na středu, ~62 % šířky obsahu (max 240 px)
//  - 3 karty  -> jedna plná řada přes šířku obsahu (malé mezery)
//  - 6 karet  -> mřížka 2×3 přes šířku obsahu
// Klepnutí na otočenou kartu otevře detail (overlay) s velkou ilustrací,
// jménem a krátkým významem (§2.4). Šířky jsou fluidní (grid + poměr
// stran), na mobilu se úměrně zmenší a nepřetečou.
import { useState } from "react";
import { CARD_BY_ID } from "@/lib/cards";
import { CardBack, CardFace } from "@/components/TarotCard";
import CardDetail, { CardDetailData } from "@/components/CardDetail";

export type ReadingCardItem = {
  cardId: string;
  name: string;
  reversed: boolean;
  position?: string;
};

export default function ReadingCards({ cards }: { cards: ReadingCardItem[] }) {
  const [detail, setDetail] = useState<CardDetailData | null>(null);
  const n = cards.length;
  // §2.1: řady po třech přes celou šířku obsahu; §2.2: jedna karta velká
  const wrap =
    n === 1
      ? "mt-2 flex justify-center"
      : "mt-2 grid w-full grid-cols-3 gap-2 sm:gap-3";
  const cell = n === 1 ? "w-[62%] max-w-[240px]" : "w-full";

  return (
    <>
      <div className={wrap}>
        {cards.map((c, i) => (
          <div key={c.cardId + i} className={`${cell} text-center`}>
            <button
              type="button"
              onClick={() => setDetail(c)}
              className="block w-full cursor-pointer"
              aria-label={`Detail karty ${c.name}`}
            >
              {CARD_BY_ID[c.cardId] ? (
                <CardFace
                  card={CARD_BY_ID[c.cardId]}
                  reversed={c.reversed}
                  className="aspect-[74/112] w-full drop-shadow-card"
                />
              ) : (
                <CardBack className="aspect-[74/112] w-full drop-shadow-card" />
              )}
            </button>
            <p className="mt-1 text-xs leading-tight text-body-dim">
              {c.name}
              {c.reversed ? " (obráceně)" : ""}
            </p>
            {c.position ? (
              <p className="text-[10px] leading-tight text-accent-soft">{c.position}</p>
            ) : null}
          </div>
        ))}
      </div>
      {detail && <CardDetail card={detail} onClose={() => setDetail(null)} />}
    </>
  );
}
