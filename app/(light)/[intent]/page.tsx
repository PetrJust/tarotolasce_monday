// Intent landing pages (kapitola 10.5): /vrati-se-ex, /co-ke-mne-citi, /mam-mu-napsat
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { INTENTS, INTENT_BY_SLUG } from "@/lib/intents";

export function generateStaticParams() {
  return INTENTS.map((i) => ({ intent: i.slug }));
}

export const dynamicParams = false;

export function generateMetadata({ params }: { params: { intent: string } }): Metadata {
  const page = INTENT_BY_SLUG[params.intent];
  if (!page) return {};
  return {
    title: page.title.slice(0, 60),
    description: page.description.slice(0, 155),
    alternates: { canonical: `https://tarotolasce.cz/${page.slug}` },
  };
}

export default function IntentPage({ params }: { params: { intent: string } }) {
  const page = INTENT_BY_SLUG[params.intent];
  if (!page) notFound();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <article className="py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <h1 className="font-display text-[42px] leading-[1.1] font-semibold leading-tight text-body">
        {page.h1}
      </h1>

      <div className="prose-tarot mt-6 leading-relaxed text-body-dim">
        {page.intro.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="font-display text-[30px] leading-[1.15] font-semibold text-accent-soft">
          Jak ti s tím tarot pomůže
        </h2>
        <div className="prose-tarot mt-4 leading-relaxed text-body-dim">
          {page.howTarotHelps.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-[30px] leading-[1.15] font-semibold text-accent-soft">
          Časté otázky
        </h2>
        <dl className="mt-4 space-y-5">
          {page.faq.map((f) => (
            <div key={f.q}>
              <dt className="font-medium text-body">{f.q}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-body-dim">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12 rounded-2xl border border-accent-dim/40 bg-surface p-6 text-center">
        <h2 className="font-display text-[30px] leading-[1.15] font-semibold text-body">
          Zeptej se karet
        </h2>
        <p className="mt-2 text-body-dim">
          První výklad za 29 Kč. Pokud ti nic nedá, peníze ti vrátíme.
        </p>
        <Link
          href={`/vyklad/novy?q=${encodeURIComponent(page.suggestedQuestion)}`}
          className="mt-4 inline-block rounded-xl bg-rose-500 px-6 py-3 font-medium text-plum-900 hover:opacity-90"
        >
          Vyložit karty
        </Link>
      </section>
    </article>
  );
}
