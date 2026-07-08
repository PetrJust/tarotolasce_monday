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

      <div className="mx-auto mt-8 grid max-w-xl grid-cols-3 gap-3">
        {reading.cards.map((c) => (
          <div key={c.position} className="text-center">
            <span className="text-[11px] leading-tight text-accent-soft">{c.position}</span>
            <div className="mt-1 rounded-lg border border-surface bg-cream/95 p-2 text-plum-900">
              <span className="block text-[11px] font-medium leading-tight">
                {c.name}
                {c.reversed ? " (obráceně)" : ""}
              </span>
            </div>
          </div>
        ))}
      </div>

      <p className="mx-auto mt-8 max-w-xl text-xs uppercase tracking-wider text-accent-soft">
        Výklad od {PERSONA_NAME}, tvé AI kartářky
      </p>
      <div className="prose-tarot mx-auto mt-2 max-w-xl text-lg leading-relaxed text-body">
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
