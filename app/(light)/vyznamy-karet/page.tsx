// Rozcestník knihovny významů (v1.6.2 §2): všech 78 karet po sekcích.
import type { Metadata } from "next";
import Link from "next/link";
import { CARD_LIBRARY, LIBRARY_SECTIONS } from "@/lib/cardLibrary";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Významy tarotových karet v lásce | Tarot o Lásce",
  description:
    "Významy všech 78 tarotových karet se zaměřením na lásku a vztahy. Velká arkána, Hole, Poháry, Meče a Pentakly, vzpřímeně i obráceně.",
  alternates: { canonical: `${SITE_URL}/vyznamy-karet` },
};

export default function LibraryIndexPage() {
  return (
    <div className="py-10">
      <h1 className="font-display text-[40px] leading-[1.12] font-semibold text-body">
        Významy karet
      </h1>
      <p className="mt-3 text-body-dim">
        Významy všech 78 tarotových karet se zaměřením na lásku a vztahy.
      </p>

      {LIBRARY_SECTIONS.map((section) => (
        <section key={section} className="mt-10">
          <h2 className="font-display text-2xl font-semibold text-body">{section}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {CARD_LIBRARY.filter((c) => c.section === section).map((c) => (
              <Link
                key={c.slug}
                href={`/vyznamy-karet/${c.slug}`}
                className="rounded-full border border-surface px-4 py-2 text-sm text-body-dim hover:border-accent-dim hover:text-body"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
