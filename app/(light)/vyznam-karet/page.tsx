// Rozcestník knihovny karet (SEO hub). SSG, plný obsah v HTML.
import type { Metadata } from "next";
import Link from "next/link";
import { DECK } from "@/lib/cards";

export const metadata: Metadata = {
  title: "Významy tarotových karet v lásce: všech 78 karet",
  description:
    "Kompletní knihovna významů tarotových karet se zaměřením na lásku a vztahy. Velká arkána, Poháry, Meče, Hole i Pentakly.",
  alternates: { canonical: "https://tarotolasce.cz/vyznam-karet" },
};

const GROUPS: { title: string; filter: (c: (typeof DECK)[number]) => boolean }[] = [
  { title: "Velká arkána", filter: (c) => c.arcana === "major" },
  { title: "Poháry", filter: (c) => c.suit === "pohary" },
  { title: "Meče", filter: (c) => c.suit === "mece" },
  { title: "Hole", filter: (c) => c.suit === "hole" },
  { title: "Pentakly", filter: (c) => c.suit === "pentakly" },
];

export default function VyznamKaretPage() {
  return (
    <div className="py-10">
      <h1 className="font-display text-[42px] leading-[1.1] font-semibold text-body">
        Významy tarotových karet v lásce
      </h1>
      <p className="mt-4 max-w-xl text-body-dim">
        Všech 78 karet tarotu a co znamenají, když se ptáš na lásku a vztahy.
        Vzpřímené i obrácené pozice, vždy s důrazem na to, co karta říká tobě.
      </p>

      {GROUPS.map((g) => (
        <section key={g.title} className="mt-10">
          <h2 className="font-display text-[30px] leading-[1.15] font-semibold text-accent-soft">
            {g.title}
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {DECK.filter(g.filter).map((c) => (
              <li key={c.id}>
                <Link
                  href={`/vyznam-karet/${c.id}`}
                  className="block rounded-xl border border-surface bg-surface px-4 py-3 text-sm text-body-dim hover:border-accent-dim hover:text-body"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
