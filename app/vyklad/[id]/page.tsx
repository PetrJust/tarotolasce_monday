// Uložený výklad (z historie / e-mailu). Server component, čte in-memory store.
import { notFound } from "next/navigation";
import { getReading } from "@/lib/store";
import ThreePaths from "@/components/ThreePaths";
import ReadingFeedback from "@/components/ReadingFeedback";
import { PERSONA_NAME } from "@/lib/persona";

export const dynamic = "force-dynamic";

export default async function SavedReadingPage({ params }: { params: { id: string } }) {
  const reading = await getReading(params.id);
  if (!reading) notFound();

  return (
    <article className="py-10">
      <p className="text-sm text-body-dim">
        {new Date(reading.createdAt).toLocaleDateString("cs-CZ")} ·{" "}
        {reading.spreadName}
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

      <ReadingFeedback readingId={reading.id} />

      <ThreePaths spread={reading.spreadKey} credits={0} singlePurchases={0} />

      <p className="mt-10 border-t border-surface pt-6 text-center text-xs text-body-dim">
        Tarot o Lásce je nástroj reflexe pro zábavu a sebepoznání. Nenahrazuje
        profesionální terapii ani medicínskou péči. V krizi kontaktuj Linku
        první psychické pomoci: 116 123.
      </p>
    </article>
  );
}
