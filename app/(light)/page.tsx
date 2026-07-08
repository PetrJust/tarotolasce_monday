// Landing: SSR, plný obsah v prvním HTML.
import type { Metadata } from "next";
import Link from "next/link";
import QuestionBox from "@/components/QuestionBox";
import { CardBack } from "@/components/TarotCard";

export const metadata: Metadata = {
  title: "Tarot o Lásce: AI tarotový výklad o lásce za 29 Kč",
  description:
    "Polož otázku, vyber si karty a AI kartářka Nomi ti napíše osobní výklad o lásce a vztazích. První výklad za 29 Kč, karta dne zdarma.",
  alternates: { canonical: "https://tarotolasce.cz/" },
};


const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Kdo mi karty vykládá?",
      acceptedAnswer: { "@type": "Answer", text: "Všechny výklady vytváří Nomi, AI kartářka aplikace Tarot o Lásce. Není to člověk; je to umělá inteligence vyladěná na laskavé a osobní výklady o lásce." },
    },
    {
      "@type": "Question",
      name: "Kolik výklad stojí?",
      acceptedAnswer: { "@type": "Answer", text: "První výklad stojí 29 Kč, další 49 Kč. Balíček 5 výkladů vychází na 199 Kč a 20 výkladů na 599 Kč. Karta dne je zdarma." },
    },
    {
      "@type": "Question",
      name: "Předpoví mi karty budoucnost?",
      acceptedAnswer: { "@type": "Answer", text: "Ne. Tarot v aplikaci slouží jako nástroj reflexe: pomáhá utřídit pocity a vidět situaci jinak. Rozhodnutí zůstává na tobě." },
    },
  ],
};

const SAMPLES = [
  {
    spread: "Jak to mezi námi je",
    question: "Jak to mezi námi teď doopravdy je?",
    excerpt:
      "Ty cítíš hluboké emoční propojení, jsi v poháru až po okraj. On je ale Rytíř pentaklů: stabilní, ale pomalý, řeší praktické věci místo pocitů. Vaše My je přesto Slunce, mezi vámi je opravdové světlo…",
  },
  {
    spread: "Ano/Ne pro srdce",
    question: "Mám mu napsat?",
    excerpt:
      "Karty teď ukazují spíš ne. Cítíš, že oddaluješ nevyhnutelné. Chceš kontakt, protože se bojíš ticha, ne protože ho potřebuješ…",
  },
  {
    spread: "Já a můj ex",
    question: "Co mě na něm pořád drží?",
    excerpt:
      "Nevyřčená zůstala tvoje vlastní síla. Cítila ses vedle něj malá. Věž říká, že rozchod byl nevyhnutelný, zhroutilo se to, co stálo na nejistých základech…",
  },
];

export default function LandingPage() {
  return (
    <div className="py-10">
      {/* Hero */}
      <section className="text-center">
        {/* Hlavní logo (dodané zakladatelem, průhledné PNG - funguje na
            libovolném světlém podkladu). Tagline je součástí loga. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-main.png"
          alt="Tarot o Lásce. Porozumět lásce. Porozumět sobě."
          width={504}
          height={145}
          className="mx-auto mb-8 w-full max-w-[420px]"
        />
        <div className="mx-auto mb-6 flex w-fit -space-x-8" aria-hidden>
          <CardBack className="h-32 w-20 -rotate-12 drop-shadow-card" />
          <CardBack className="h-32 w-20 drop-shadow-card" />
          <CardBack className="h-32 w-20 rotate-12 drop-shadow-card" />
        </div>
        <h1 className="font-display text-[42px] leading-[1.1] font-semibold leading-tight text-body sm:text-5xl">
          Co ti dnes řeknou karty o lásce?
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-body-dim">
          Jsem Nomi, tvoje AI kartářka. Polož mi otázku, vyber si vlastníma
          rukama karty z vějíře a já ti je osobně vyložím. Klidně, beze
          spěchu, jen pro tebe. První výklad za 29 Kč.
        </p>
      </section>

      <section className="mt-10">
        <QuestionBox />
      </section>

      {/* Karta dne teaser */}
      <section className="mt-14 rounded-2xl border border-surface bg-surface p-6 text-center">
        <h2 className="font-display text-[30px] leading-[1.15] font-semibold text-body">
          Karta dne zdarma
        </h2>
        <p className="mt-2 text-body-dim">
          Každý den ti Nomi otočí jednu kartu a napíše krátký vzkaz pro tvoje
          srdce. Bez placení, bez závazků.
        </p>
        <Link
          href="/karta-dne"
          className="mt-4 inline-block rounded-xl border border-accent-dim px-6 py-3 text-accent-soft hover:border-accent"
        >
          Otočit dnešní kartu
        </Link>
      </section>

      {/* Ukázkové výklady */}
      <section className="mt-14">
        <h2 className="font-display text-[32px] leading-[1.15] font-semibold text-body">
          Jak vypadá výklad
        </h2>
        <div className="mt-6 space-y-4">
          {SAMPLES.map((s) => (
            <article
              key={s.question}
              className="rounded-2xl border border-surface bg-surface p-5"
            >
              <p className="text-xs uppercase tracking-wider text-accent-soft">
                {s.spread}
              </p>
              <h3 className="mt-1 font-display text-xl font-semibold text-body">
                „{s.question}"
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-body-dim">
                {s.excerpt}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Jak to funguje */}
      <section className="mt-14">
        <h2 className="font-display text-[32px] leading-[1.15] font-semibold text-body">
          Jak to funguje
        </h2>
        <ol className="mt-6 space-y-4 text-body-dim">
          <li>
            <strong className="text-body">1. Polož otázku.</strong> Vlastními
            slovy, jak ti to přijde. Podle otázky vybereme rozklad, který jí
            sedne.
          </li>
          <li>
            <strong className="text-body">2. Vyber si karty.</strong> Z vějíře
            78 karet, zamíchaných jen pro tebe. Nech se vést rukou.
          </li>
          <li>
            <strong className="text-body">3. Přečti si výklad.</strong>{" "}
            Tvé karty ti vyloží Nomi, naše AI kartářka. Osobně, ke tvé otázce.
            Výklad ti zůstane uložený, kdykoli se k němu vrátíš.
          </li>
        </ol>
        <p className="mt-6 text-sm text-body-dim">
          Výklady generuje AI. Pokud ti první výklad nic nedá, napiš nám a
          29 Kč ti vrátíme.
        </p>
      </section>

      {/* SKRYTO do launche: smyšlené recenze jsou po novele zákona o ochraně
          spotřebitele zakázaná praktika. Sekce se zapne až se skutečnými
          recenzemi (komponenta zachována). */}
      {false && (
      <section className="mt-14">
        <h2 className="font-display text-[30px] leading-[1.15] font-semibold text-body">
          Zkušenosti
        </h2>
        <div className="mt-5 space-y-4">
          {[
            {
              text: "Nomi mi pomohla vidět situaci s bývalým úplně jinak. Konečně jsem si přiznala, co jsem dlouho věděla.",
              who: "Markéta K.",
              when: "duben 2026",
            },
            {
              text: "Byla jsem skeptická, ale výklad byl laskavý a překvapivě trefný v tom, co teď prožívám. Rituál s kartami je krásný.",
              who: "Lucie N.",
              when: "duben 2026",
            },
            {
              text: "Vracím se ke kartě dne každé ráno. Je to malá chvilka jen pro mě, než začne den.",
              who: "Jana D.",
              when: "březen 2026",
            },
          ].map((r) => (
            <blockquote
              key={r.who}
              className="rounded-2xl border border-surface bg-surface p-5"
            >
              <p className="text-body">„{r.text}"</p>
              <footer className="mt-2 text-sm text-body-dim">
                {r.who} · {r.when}
              </footer>
            </blockquote>
          ))}
        </div>
      </section>
      )}


      {/* FAQ (schváleno zadáním paleta-a-kontrast; FAQPage JSON-LD níže) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <section className="mt-14">
        <h2 className="font-display text-[30px] leading-[1.15] font-semibold text-body">
          Časté otázky
        </h2>
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-surface bg-surface p-5">
            <h3 className="font-medium text-body">Kdo mi karty vykládá?</h3>
            <p className="mt-1 text-sm text-body-dim">
              Všechny výklady vytváří Nomi, naše AI kartářka. Není to člověk;
              je to umělá inteligence vyladěná na laskavé a osobní výklady o
              lásce. Píše jen pro tebe, ke tvé otázce a tvým kartám.
            </p>
          </div>
          <div className="rounded-2xl border border-surface bg-surface p-5">
            <h3 className="font-medium text-body">Kolik výklad stojí?</h3>
            <p className="mt-1 text-sm text-body-dim">
              První výklad stojí 29 Kč, další 49 Kč. Balíček 5 výkladů vychází
              na 199 Kč a 20 výkladů na 599 Kč. Karta dne je každý den zdarma.
            </p>
          </div>
          <div className="rounded-2xl border border-surface bg-surface p-5">
            <h3 className="font-medium text-body">Předpoví mi karty budoucnost?</h3>
            <p className="mt-1 text-sm text-body-dim">
              Ne, a ani se o to nesnažíme. Tarot u nás slouží jako zrcadlo:
              pomáhá ti utřídit pocity a vidět situaci jinýma očima. Rozhodnutí
              zůstává vždycky na tobě.
            </p>
          </div>
        </div>
      </section>

      {/* Knihovna karet */}
      <section className="mt-14 rounded-2xl border border-surface bg-surface p-6">
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
