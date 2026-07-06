// Krizové obrazovky 7.4: plnoobrazovkové, klidný design, bez animací.
// Checkout se v nich nikdy nezobrazí. Jméno Nomi se zde nepoužívá.
import Link from "next/link";

type Variant = "crisis_a" | "crisis_b" | "crisis_c";

const TEL = ({ number, label }: { number: string; label: string }) => (
  <a
    href={`tel:${number.replace(/\s/g, "")}`}
    className="block w-full rounded-xl bg-gold px-5 py-3.5 text-center font-medium text-night hover:bg-gold-soft"
  >
    {label}
  </a>
);

export default function CrisisScreen({
  variant,
  spirioHref,
  onBack,
}: {
  variant: Variant;
  spirioHref: string;
  onBack: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-night-deep">
      <div className="mx-auto flex min-h-full max-w-md flex-col justify-center gap-6 px-5 py-12">
        {variant === "crisis_a" && (
          <>
            <h1 className="font-display text-[40px] leading-[1.12] font-semibold text-cream">
              Teď jsi důležitější ty, ne karty.
            </h1>
            <div className="space-y-4 text-cream-dim">
              <p>
                Slyším tě. To, co píšeš, zní jako hodně těžká chvíle a nechci na
                ni odpovídat kartami. Jsem AI a tohle je situace, kde má být u
                tebe skutečný člověk.
              </p>
              <p>
                Linka první psychické pomoci: 116 123. Funguje nonstop, je
                zdarma a vyslechnou tě.
              </p>
              <p>Pokud cítíš, že je to akutní, volej 155 nebo 112.</p>
              <p>
                A jestli by ti udělalo dobře mluvit o tom, co prožíváš, živé
                průvodkyně na Spiriu naslouchají přes chat i hovor.
              </p>
            </div>
            <div className="space-y-3">
              <TEL number="116123" label="Zavolat 116 123" />
              <a
                href={spirioHref}
                className="block w-full rounded-xl border border-gold-dim px-5 py-3.5 text-center text-gold-soft hover:border-gold"
              >
                Živá průvodkyně na Spiriu
              </a>
              <button
                onClick={onBack}
                className="block w-full px-5 py-3 text-center text-sm text-cream-dim hover:text-cream"
              >
                Vrátit se ke kartám jindy
              </button>
            </div>
          </>
        )}

        {variant === "crisis_b" && (
          <>
            <h1 className="font-display text-[40px] leading-[1.12] font-semibold text-cream">
              Tohle není v pořádku. A není to tvoje vina.
            </h1>
            <div className="space-y-4 text-cream-dim">
              <p>
                To, co popisuješ, zní jako násilí. Karty tady nepomůžou a já
                jako AI taky ne. Existují ale lidé, kteří přesně s tímhle
                pomáhají každý den.
              </p>
              <p>
                Bílý kruh bezpečí: 116 006. Nonstop, zdarma, anonymně. Poradí
                ti bezpečné kroky a vyslechnou tě bez hodnocení.
              </p>
              <p>Pokud jsi v ohrožení právě teď, volej 158 nebo 112.</p>
            </div>
            <div className="space-y-3">
              <TEL number="116006" label="Zavolat 116 006" />
              <button
                onClick={onBack}
                className="block w-full px-5 py-3 text-center text-sm text-cream-dim hover:text-cream"
              >
                Vrátit se jindy
              </button>
            </div>
          </>
        )}

        {variant === "crisis_c" && (
          <>
            <h1 className="font-display text-[40px] leading-[1.12] font-semibold text-cream">
              Tarot o Lásce je pro dospělé.
            </h1>
            <div className="space-y-4 text-cream-dim">
              <p>
                Z tvé otázky to vypadá, že ti ještě nebylo 18. Tahle služba je
                jen pro dospělé, takže výklad neudělám.
              </p>
              <p>
                To, co prožíváš, tím ale nemizí. Linka bezpečí 116 111 je tu
                přesně pro tebe. Zdarma, nonstop, anonymně. Můžeš jim taky
                napsat na chatu na linkabezpeci.cz.
              </p>
            </div>
            <div className="space-y-3">
              <TEL number="116111" label="Zavolat 116 111" />
              <a
                href="https://linkabezpeci.cz"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-xl border border-gold-dim px-5 py-3.5 text-center text-gold-soft hover:border-gold"
              >
                linkabezpeci.cz
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
