// Zobrazení vytažených karet ve výkladu (placený výklad + detail v
// historii). Jednotná výška bloku „dva řádky" (řádek = běžná karta h-28):
//  - 1 karta  -> velká karta přes dva řádky (vycentrovaná)
//  - 3 karty  -> tři velké karty vedle sebe, každá přes dva řádky
//  - 6 karet  -> mřížka 3 + 3 v běžné velikosti (dohromady dva řádky)
// Šířky jsou fluidní (grid + aspect ratio), takže se na mobilu úměrně
// zmenší a nikdy nepřetečou.
import { CARD_BY_ID } from "@/lib/cards";
import { CardBack, CardFace } from "@/components/TarotCard";

export type ReadingCardItem = {
  cardId: string;
  name: string;
  reversed: boolean;
  position?: string;
};

export default function ReadingCards({ cards }: { cards: ReadingCardItem[] }) {
  const n = cards.length;
  // rozložení kontejneru dle počtu karet
  const wrap =
    n === 1
      ? "mt-2 flex justify-center"
      : n === 3
      ? "mt-2 grid w-full max-w-[480px] grid-cols-3 gap-3"
      : n === 6
      ? "mt-2 grid w-full max-w-[264px] grid-cols-3 gap-3"
      : "mt-2 flex flex-wrap gap-3"; // fallback pro jiný počet
  // velikost jedné karty
  const cell =
    n === 1 ? "w-[148px]" : n === 3 || n === 6 ? "w-full" : "w-[74px]";

  return (
    <div className={wrap}>
      {cards.map((c, i) => (
        <div key={c.cardId + i} className={`${cell} text-center`}>
          {CARD_BY_ID[c.cardId] ? (
            <CardFace
              card={CARD_BY_ID[c.cardId]}
              reversed={c.reversed}
              className="aspect-[74/112] w-full drop-shadow-card"
            />
          ) : (
            <CardBack className="aspect-[74/112] w-full drop-shadow-card" />
          )}
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
  );
}
