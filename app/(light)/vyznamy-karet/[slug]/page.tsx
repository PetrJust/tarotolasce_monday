// Stránka významu karty (v1.6.2). SSG pro všech 78 karet - obsah je
// v HTML zdrojáku (SEO je primární důvod existence knihovny). Texty jdou
// 1:1 z lib/cardLibrary.ts (zdroj pravdy: schválený soubor zakladatele).
// Struktura: H1 jméno -> úvod -> H2 Vzpřímeně -> H2 Obráceně -> CTA.
// Dole interní prolinkování na ostatní karty stejné sady (nahrazuje
// dřívější náhodné „související karty").
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CARD_LIBRARY, LIBRARY_BY_SLUG, sameSection } from "@/lib/cardLibrary";
import { CARD_BY_ID } from "@/lib/cards";
import { CardFace } from "@/components/TarotCard";
import LibraryCta from "@/components/LibraryCta";
import { SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return CARD_LIBRARY.map((c) => ({ slug: c.slug }));
}
export const dynamicParams = false;

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const card = LIBRARY_BY_SLUG[params.slug];
  if (!card) return {};
  // vzor v1.6.2 §2: „Věž: význam karty v lásce | Tarot o Lásce"
  return {
    title: `${card.name}: význam karty v lásce | Tarot o Lásce`,
    description: `${card.name}: význam karty v lásce a vztazích. Vzpřímeně i obráceně, pro vztah i pro single.`.slice(0, 155),
    alternates: { canonical: `${SITE_URL}/vyznamy-karet/${card.slug}` },
  };
}

// odstavce zdroje obsahují *kurzívu* na začátku (Vzpřímeně/Obráceně) a
// místy „uvozovky"; vykreslíme *...* jako <em>, zbytek beze změny
function Em({ text }: { text: string }) {
  const parts = text.split(/(\*[^*]+\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("*") && p.endsWith("*") ? <em key={i}>{p.slice(1, -1)}</em> : p
      )}
    </>
  );
}

export default function LibraryCardPage({ params }: { params: { slug: string } }) {
  const card = LIBRARY_BY_SLUG[params.slug];
  if (!card) notFound();
  const others = sameSection(card.slug);
  const appCard = card.appId ? CARD_BY_ID[card.appId] : undefined;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Významy karet", item: `${SITE_URL}/vyznamy-karet` },
      { "@type": "ListItem", position: 2, name: card.name, item: `${SITE_URL}/vyznamy-karet/${card.slug}` },
    ],
  };

  return (
    <article className="py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <nav className="text-sm text-body-dim">
        <Link href="/vyznamy-karet" className="text-accent-soft underline underline-offset-2">
          Významy karet
        </Link>{" "}
        · {card.section}
      </nav>

      <h1 className="mt-3 font-display text-[40px] leading-[1.12] font-semibold text-body">
        {card.name}
      </h1>

      {appCard && (
        <div className="mt-6">
          <CardFace card={appCard} className="aspect-[74/112] w-[140px] drop-shadow-card" />
        </div>
      )}

      {card.intro.map((p, i) => (
        <p key={i} className="prose-tarot mt-5 text-lg leading-relaxed text-body">
          <Em text={p} />
        </p>
      ))}

      <h2 className="mt-8 font-display text-2xl font-semibold text-body">Vzpřímeně</h2>
      <p className="prose-tarot mt-3 text-lg leading-relaxed text-body">
        <Em text={card.up} />
      </p>

      <h2 className="mt-8 font-display text-2xl font-semibold text-body">Obráceně</h2>
      <p className="prose-tarot mt-3 text-lg leading-relaxed text-body">
        <Em text={card.rev} />
      </p>

      <LibraryCta cta={card.cta} slug={card.slug} />

      {/* Interní prolinkování: ostatní karty stejné sady (v1.6.2 §2) */}
      <section className="mt-12 border-t border-surface pt-6">
        <h2 className="text-xs uppercase tracking-wider text-body-dim">
          Další karty · {card.section}
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {others.map((c) => (
            <Link
              key={c.slug}
              href={`/vyznamy-karet/${c.slug}`}
              className="rounded-full border border-surface px-3 py-1.5 text-sm text-body-dim hover:border-accent-dim hover:text-body"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
