import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Obchodní podmínky",
  description:
    "Obchodní podmínky služby Tarot o Lásce: digitální obsah, ceny, platby a vrácení peněz.",
  alternates: { canonical: "https://tarotolasce.cz/obchodni-podminky" },
};

export default function Page() {
  return (
    <article className="prose-tarot py-10 leading-relaxed text-body-dim">
      <h1 className="font-display text-[42px] leading-[1.1] font-semibold text-body">
        Obchodní podmínky
      </h1>
      <p className="mt-6 rounded-xl border border-accent-dim/40 bg-surface p-3 text-xs text-accent-soft">
        TODO: Finální znění dodá právník. Níže je struktura s pracovními texty.
      </p>
      <h2 className="mt-8 font-display text-[30px] leading-[1.15] text-body">1. Provozovatel</h2>
      <p>TODO: identifikace provozovatele, IČO, sídlo, kontakt.</p>
      <h2 className="mt-6 font-display text-[30px] leading-[1.15] text-body">2. Služba</h2>
      <p>
        Tarot o Lásce poskytuje digitální obsah: tarotové výklady generované
        umělou inteligencí. Služba je určena výhradně osobám starším 18 let a
        slouží k zábavě a sebepoznání. Nenahrazuje odborné poradenství.
      </p>
      <h2 className="mt-6 font-display text-[30px] leading-[1.15] text-body">3. Ceny a platby</h2>
      <p>
        První výklad 29 Kč, jednotlivý výklad 49 Kč, balíček 5 výkladů 199 Kč,
        balíček 20 výkladů 599 Kč. Žádné předplatné, žádné automatické
        strhávání. TODO: platební metody a zpracovatel plateb.
      </p>
      <h2 className="mt-6 font-display text-[30px] leading-[1.15] text-body">4. Dodání a odstoupení</h2>
      <p>
        Digitální obsah je dodán ihned po zaplacení. Zákaznice před platbou
        výslovně souhlasí s okamžitým dodáním a bere na vědomí ztrátu práva na
        odstoupení od smlouvy ve 14denní lhůtě. TODO: přesné znění dle
        občanského zákoníku.
      </p>
      <h2 className="mt-6 font-display text-[30px] leading-[1.15] text-body">5. Garance spokojenosti</h2>
      <p>
        Pokud první výklad zákaznici nic nedá, na základě e-mailové žádosti
        vracíme 29 Kč. TODO: podmínky a lhůty garance.
      </p>
    </article>
  );
}
