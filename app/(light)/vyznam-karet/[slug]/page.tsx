// Šablona stránky karty (kapitola 10.4). SSG pro všech 78 karet.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DECK, CARD_BY_ID, relatedCards } from "@/lib/cards";
import { cardContent, hasFullContent } from "@/lib/cardContent";
import { CardFace } from "@/components/TarotCard";

export function generateStaticParams() {
  return DECK.map((c) => ({ slug: c.id }));
}

export const dynamicParams = false;

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const card = CARD_BY_ID[params.slug];
  if (!card) return {};
  const title = `${card.name}: význam v lásce a vztazích`;
  const written = hasFullContent(card.id);
  return {
    title: title.length > 60 ? `${card.name}: význam v lásce` : title,
    description: `Co znamená karta ${card.name} v lásce? Vzpřímená i obrácená pozice a co karta říká pro tvou otázku o vztahu.`.slice(0, 155),
    alternates: { canonical: `https://tarotolasce.cz/vyznam-karet/${card.id}` },
    // Placeholder karty se neindexují, dokud nemají plný obsah (TODO_CONTENT).
    robots: written ? undefined : { index: false, follow: true },
  };
}

export default function CardPage({ params }: { params: { slug: string } }) {
  const card = CARD_BY_ID[params.slug];
  if (!card) notFound();
  const content = cardContent(card.id);
  const related = relatedCards(card.id);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Významy karet", item: "https://tarotolasce.cz/vyznam-karet" },
      { "@type": "ListItem", position: 2, name: card.name, item: `https://tarotolasce.cz/vyznam-karet/${card.id}` },
    ],
  };

  return (
    <article className="py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <nav className="text-sm text-body-dim">
        <Link href="/vyznam-karet" className="hover:text-body">
          Významy karet
        </Link>{" "}
        / <span className="text-body">{card.name}</span>
      </nav>

      <div className="mt-6 flex items-start gap-6">
        <CardFace card={card} className="h-44 w-28 shrink-0 drop-shadow-card" />
        <div>
          <h1 className="font-display text-[42px] leading-[1.1] font-semibold leading-tight text-body">
            {card.name}: význam v lásce a vztazích
          </h1>
        </div>
      </div>

      {content.isPlaceholder && (
        <p className="mt-4 rounded-xl border border-accent-dim/40 bg-surface p-3 text-xs text-accent-soft">
          TODO_CONTENT: plný text této karty doplní obsahový tým.
        </p>
      )}

      <section className="mt-8">
        <h2 className="font-display text-[30px] leading-[1.15] font-semibold text-accent-soft">
          Vzpřímená
        </h2>
        <p className="mt-3 leading-relaxed text-body-dim">{content.upright}</p>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-[30px] leading-[1.15] font-semibold text-accent-soft">
          Obrácená
        </h2>
        <p className="mt-3 leading-relaxed text-body-dim">{content.reversed}</p>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-[30px] leading-[1.15] font-semibold text-accent-soft">
          Co znamená pro tvou otázku
        </h2>
        <p className="mt-3 leading-relaxed text-body-dim">
          {content.forYourQuestion}
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-body">
          Související karty
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {related.map((r) => (
            <Link
              key={r.id}
              href={`/vyznam-karet/${r.id}`}
              className="rounded-full border border-surface px-4 py-2 text-sm text-body-dim hover:border-accent-dim hover:text-body"
            >
              {r.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-2xl border border-accent-dim/40 bg-surface p-6 text-center">
        <h2 className="font-display text-[30px] leading-[1.15] font-semibold text-body">
          Zeptej se na svou otázku
        </h2>
        <p className="mt-2 text-body-dim">
          Karta v knihovně je obecná. Výklad k tvé otázce je jen tvůj.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-xl bg-rose-500 px-6 py-3 font-medium text-plum-900 hover:opacity-90"
        >
          Položit otázku
        </Link>
      </section>
    </article>
  );
}
