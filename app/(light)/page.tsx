// Landing: SSR, plný obsah v prvním HTML.
// v1.6 §7.5 pořadí: Hero · Typy výkladů · Karta dne zdarma · FAQ · Footer.
// Sekce „Jak to funguje" a „Jak vypadá výklad" ZRUŠENY (živá ochutnávka
// Flow B je nahrazuje). Knihovna karet zůstává (SEO, není v zrušených).
import type { Metadata } from "next";
import Link from "next/link";
import QuestionBox from "@/components/QuestionBox";
import { CardBack } from "@/components/TarotCard";
import { PERSONA_NAME, PERSONA_FULL } from "@/lib/persona";

export const metadata: Metadata = {
  title: "Tarot o Lásce: AI tarotový výklad o lásce za 29 Kč",
  description:
    `Porozumět lásce. Porozumět sobě. Polož otázku, vyber si karty a ${PERSONA_FULL} ti připraví osobní výklad o lásce. První výklad za 29 Kč, karta dne zdarma.`,
  alternates: { canonical: "https://tarotolasce.cz/" },
};

// FAQ 7.4 DOSLOVA (čtyři otázky) - i do JSON-LD
const FAQ = [
  {
    q: "Kdo mi výklad připravuje?",
    a: "Výklady vytváří Nomi, AI kartářka. Není to člověk. Pracuje s tvojí otázkou a kartami, které si vybereš.",
  },
  {
    q: "Kolik výklad stojí?",
    a: "První výklad stojí 29 Kč, další 49 Kč. Pokud se chceš vracet častěji, můžeš si vybrat i výhodnější balíček. Nejde o předplatné a nic se nestrhává automaticky.",
  },
  {
    q: "Předpoví mi karty budoucnost?",
    a: "Ne jako pevný scénář. Tarot bereme jako zrcadlo. Pomáhá pojmenovat, co se v situaci děje, a co můžeš udělat dál.",
  },
  {
    q: "Co když mi první výklad nesedne?",
    a: "Napiš nám. Když ti první výklad nic nedá, vrátíme ti 29 Kč.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

// 7.2 Typy výkladů DOSLOVA
const TYPES = [
  {
    q: "«Má mě rád?»",
    tag: "Ano / Ne · 1 karta",
    text: "Rychlý výklad, když potřebuješ jasnější směr. Nomi vytáhne jednu kartu a ukáže, jestli to mezi vámi směřuje spíš k ano, nebo spíš k ne.",
  },
  {
    q: "«Kdy se ozve?»",
    tag: "3 karty",
    text: "Výklad pro chvíle, kdy čekáš na zprávu. Tři karty ukážou, co se děje teď, co kontakt brzdí a kam se situace může posunout.",
  },
  {
    q: "«Vrátí se ke mně ex?»",
    tag: "6 karet",
    text: "Hlubší výklad pro vztah, který v tobě pořád zůstává. Šest karet se podívá na minulost, jeho pocity, překážky, možnost návratu i tvůj další krok.",
  },
];

export default function LandingPage() {
  return (
    <div className="py-10">
      {/* HERO (7.1 DOSLOVA) */}
      <section className="text-center">
        {/* v1.6.1 §1 (invariant 9): logo je na obrazovce právě jednou -
            v hlavičce. Hero začíná ilustrací karet a jde rovnou k otázce. */}
        <div className="mx-auto mb-6 flex w-fit -space-x-8" aria-hidden>
          <CardBack className="h-32 w-20 -rotate-12 drop-shadow-card" />
          <CardBack className="h-32 w-20 drop-shadow-card" />
          <CardBack className="h-32 w-20 rotate-12 drop-shadow-card" />
        </div>
        <h1 className="font-display text-[42px] leading-[1.1] font-semibold text-body sm:text-5xl">
          Na co teď v lásce pořád myslíš?
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-body-dim">
          Napiš otázku vlastními slovy. {PERSONA_NAME} ti zamíchá karty a
          připraví výklad, ke kterému se můžeš kdykoliv vrátit.
        </p>
        <p className="mx-auto mt-2 max-w-xl text-body-dim">
          První výklad za 29 Kč. Bez předplatného.
        </p>
      </section>

      <section className="mt-10">
        <QuestionBox />
      </section>

      {/* TYPY VÝKLADŮ (7.2, nová sekce) */}
      <section className="mt-16">
        <h2 className="font-display text-[32px] leading-[1.15] font-semibold text-body">
          Každá otázka potřebuje jiný typ výkladu
        </h2>
        <p className="mt-3 max-w-2xl text-body-dim">
          Na jednoduchou otázku stačí jedna karta. Když se ale k někomu pořád
          vracíš v myšlenkách, je potřeba podívat se hlouběji.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {TYPES.map((t) => (
            <div key={t.q} className="rounded-2xl border border-surface bg-surface p-6">
              <p className="font-display text-xl font-semibold text-body">{t.q}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-accent-soft">
                {t.tag}
              </p>
              <p className="mt-3 text-sm text-body-dim">{t.text}</p>
            </div>
          ))}
        </div>
        <Link href="/vyklad/novy" className="btn-primary mt-6 w-full sm:w-auto">
          Položit vlastní otázku
        </Link>
      </section>

      {/* KARTA DNE ZDARMA (7.3 DOSLOVA) */}
      <section className="mt-16 rounded-2xl border border-surface bg-surface p-6 text-center">
        <h2 className="font-display text-[30px] leading-[1.15] font-semibold text-body">
          Karta dne zdarma
        </h2>
        <p className="mt-2 text-body-dim">
          Jedna karta na dnešek. Krátký vzkaz, ke kterému se můžeš během dne
          vrátit.
        </p>
        <Link
          href="/karta-dne"
          className="mt-4 inline-block rounded-xl border border-accent-dim px-6 py-3 text-accent-soft hover:border-accent"
        >
          Otočit kartu dne
        </Link>
      </section>

      {/* FAQ (7.4 DOSLOVA, akordeon sbalený) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <section className="mt-16">
        <h2 className="font-display text-[30px] leading-[1.15] font-semibold text-body">
          Časté otázky
        </h2>
        <div className="mt-5 space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-surface bg-surface p-5">
              <summary className="cursor-pointer list-none font-medium text-body [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="float-right text-accent-soft transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm text-body-dim">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Knihovna karet (SEO; není v zrušených sekcích §7.5) */}
      <section className="mt-16 rounded-2xl border border-surface bg-surface p-6">
        <h2 className="font-display text-[30px] leading-[1.15] font-semibold text-body">
          Co znamenají karty v lásce
        </h2>
        <p className="mt-2 text-body-dim">
          Významy všech 78 tarotových karet se zaměřením na lásku a vztahy.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            ["zamilovani", "Zamilovaní"],
            ["vez", "Věž"],
            ["smrt", "Smrt"],
            ["dvojka-pohary", "Dvojka pohárů"],
            ["trojka-mece", "Trojka mečů"],
          ].map(([slug, name]) => (
            <Link
              key={slug}
              href={`/vyznam-karet/${slug}`}
              className="rounded-full border border-surface px-4 py-2 text-sm text-body-dim hover:border-accent-dim hover:text-body"
            >
              {name}
            </Link>
          ))}
          <Link
            href="/vyznam-karet"
            className="rounded-full border border-accent-dim px-4 py-2 text-sm text-accent-soft hover:border-accent"
          >
            Všechny karty
          </Link>
        </div>
      </section>
    </div>
  );
}
