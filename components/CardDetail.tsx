"use client";
// Detail otočené karty (v1.6.1 §2.4): klepnutí na otočenou kartu ve
// výkladu otevře overlay s velkou ilustrací přes šířku, jménem karty a
// krátkým významem + návrat zpět. Výklad zůstává, kde byl (overlay,
// žádná navigace).
import { useEffect } from "react";
import { CARD_BY_ID } from "@/lib/cards";
import { cardMeaning } from "@/lib/mockReadings";
import { CardFace } from "@/components/TarotCard";

export type CardDetailData = {
  cardId: string;
  name: string;
  reversed: boolean;
  position?: string;
};

export default function CardDetail({
  card,
  onClose,
}: {
  card: CardDetailData;
  onClose: () => void;
}) {
  // Esc zavírá; zámek scrollu pod overlayem
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const full = CARD_BY_ID[card.cardId];
  const meaning = cardMeaning({
    cardId: card.cardId,
    name: card.name,
    reversed: card.reversed,
    position: card.position ?? "",
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-plum-900/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Detail karty ${card.name}`}
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-blush-50 p-5 text-center shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        {full ? (
          <CardFace
            card={full}
            reversed={card.reversed}
            className="mx-auto aspect-[74/112] w-full max-w-[260px] drop-shadow-card"
          />
        ) : null}
        <h2 className="mt-4 font-display text-2xl text-body">
          {card.name}
          {card.reversed ? " (obráceně)" : ""}
        </h2>
        {card.position ? (
          <p className="mt-1 text-xs uppercase tracking-wider text-accent-soft">
            {card.position}
          </p>
        ) : null}
        <p className="mt-3 text-body-dim">{meaning.charAt(0).toUpperCase() + meaning.slice(1)}.</p>
        <button onClick={onClose} className="btn-primary mt-5 w-full">
          Zpět k výkladu
        </button>
      </div>
    </div>
  );
}
