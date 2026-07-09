// Uložený výklad (z historie / e-mailu). Server component. Čte z podepsané
// cookie (interim historie do PostgreSQL) a text výkladu regeneruje z karet
// mock enginem; fallback na server store (lib/store) kvůli starším odkazům
// a produkci s DB.
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getReading } from "@/lib/store";
import { READINGS_COOKIE, findReading } from "@/lib/cookieReadings";
import { mockFlowB, mockReading } from "@/lib/mockReadings";
import { SpreadKey } from "@/lib/spreads";
import ReadingCards from "@/components/ReadingCards";
import ThreePaths from "@/components/ThreePaths";
import ReadingFeedback from "@/components/ReadingFeedback";
import { PERSONA_NAME } from "@/lib/persona";
import { DISCLAIMER } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function SavedReadingPage({ params }: { params: { id: string } }) {
  // 1) primárně z podepsané cookie (spolehlivé per prohlížeč na serverless)
  const cookieReading = findReading(cookies().get(READINGS_COOKIE)?.value, params.id);

  let reading:
    | {
        id: string;
        question: string;
        spreadKey: string;
        cards: { cardId: string; name: string; reversed: boolean; position: string }[];
        text: string;
        createdAt: number;
      }
    | undefined;

  if (cookieReading) {
    // Text regenerujeme z karet (engine je deterministický). Používáme
    // stejné jméno jako v době výkladu, ať sedí oslovení v úvodu.
    const sp = cookieReading.spreadKey as SpreadKey;
    const text = mockFlowB(sp, cookieReading.question, cookieReading.cards, cookieReading.name).full
      // pro jistotu fallback, kdyby flowB pro daný spread nedával smysl:
      || mockReading(sp, cookieReading.question, cookieReading.cards, cookieReading.name);
    reading = {
      id: cookieReading.id,
      question: cookieReading.question,
      spreadKey: cookieReading.spreadKey,
      cards: cookieReading.cards,
      text,
      createdAt: cookieReading.createdAt,
    };
  } else {
    // 2) fallback na server store (DB v produkci / starší odkazy)
    const s = await getReading(params.id);
    if (s) {
      reading = {
        id: s.id,
        question: s.question,
        spreadKey: s.spreadKey,
        cards: s.cards,
        text: s.text,
        createdAt: s.createdAt,
      };
    }
  }

  if (!reading) notFound();

  return (
    <article className="py-10">
      {/* v1.5 §5.3: jen datum, žádný typ výkladu */}
      <p className="text-sm text-body-dim">
        {new Date(reading.createdAt).toLocaleDateString("cs-CZ")}
      </p>
      <h1 className="mt-2 font-display text-[40px] leading-[1.12] font-semibold text-body">
        „{reading.question}"
      </h1>

      {/* Karty stejně jako v čerstvém výkladu: obrázky lícem nahoru se
          skutečnou orientací + název pod nimi. Layout se přizpůsobí počtu
          karet (1 / 3 / 6), nezalomí se do gridu se špatnými sloupci. */}
      <p className="mt-8 text-xs uppercase tracking-wider text-body-dim">Tvoje karty</p>
      {/* Rozložení dle počtu karet: 1 velká / 3 velké / 6 v mřížce 3+3 */}
      <ReadingCards cards={reading.cards} />

      <p className="mt-8 text-xs uppercase tracking-wider text-accent-soft">
        Výklad od {PERSONA_NAME}, tvé AI kartářky
      </p>
      {/* whitespace-pre-line zachová zalomení odstavců (\n\n) z enginu,
          stejně jako živý ReadingStream. */}
      <div className="prose-tarot mt-2 whitespace-pre-line text-lg leading-relaxed text-body">
        {reading.text}
      </div>

      <ReadingFeedback readingId={reading.id} spread={reading.spreadKey} />

      <ThreePaths spread={reading.spreadKey} credits={0} singlePurchases={0} />

      <p className="mt-10 border-t border-surface pt-6 text-center text-xs text-body-dim">
        {DISCLAIMER}
      </p>
    </article>
  );
}
