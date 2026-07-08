import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reklamace a vrácení peněz",
  description:
    "Jak reklamovat výklad na Tarot o Lásce a jak funguje garance vrácení 29 Kč za první výklad.",
  alternates: { canonical: "https://tarotolasce.cz/reklamace" },
};

export default function Page() {
  return (
    <article className="prose-tarot py-10 leading-relaxed text-body-dim">
      <h1 className="font-display text-[42px] leading-[1.1] font-semibold text-body">
        Reklamace
      </h1>
      <p className="mt-6 rounded-xl border border-accent-dim/40 bg-surface p-3 text-xs text-accent-soft">
        TODO: Finální znění dodá právník. Níže je struktura s pracovními texty.
      </p>
      <h2 className="mt-8 font-display text-[30px] leading-[1.15] text-body">Garance prvního výkladu</h2>
      <p>
        Pokud ti první výklad nic nedá, napiš nám a 29 Kč ti vrátíme. Stačí
        e-mail z adresy, na kterou je výklad uložený. TODO: kontaktní adresa a
        lhůta vrácení.
      </p>
      <h2 className="mt-6 font-display text-[30px] leading-[1.15] text-body">Technické problémy</h2>
      <p>
        Pokud se zaplacený výklad nevygeneroval, nikdy o něj nepřijdeš. Najdeš
        ho ve své historii, případně nám napiš a vyřešíme to. Kredit se nikdy
        nestrhává za nevydaný výklad.
      </p>
      <h2 className="mt-6 font-display text-[30px] leading-[1.15] text-body">Postup reklamace</h2>
      <p>TODO: kontaktní e-mail, lhůty vyřízení, mimosoudní řešení sporů (ČOI).</p>
    </article>
  );
}
