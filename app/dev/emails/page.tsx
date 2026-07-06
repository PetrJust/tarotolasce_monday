// Náhledy e-mailových šablon (jen dev, noindex přes app/dev/layout.tsx).
// E-maily se v mock režimu nikam neposílají. Texty drží tón produktu:
// klid, péče, žádné predikce, žádný nátlak.
const FOOTER_TRANSACTIONAL =
  "Tarot o Lásce · tarotolasce.cz · Výklady generuje AI · Tento e-mail jsme ti poslali, protože sis u nás uložila výklad. V krizi kontaktuj Linku první psychické pomoci: 116 123.";

const FOOTER_MARKETING =
  "Tarot o Lásce · tarotolasce.cz · Výklady generuje AI · Tenhle e-mail dostáváš, protože odebíráš kartu dne. Odhlásit se můžeš jedním klikem tady: {odhlasit_url}. V krizi kontaktuj Linku první psychické pomoci: 116 123.";

type EmailTpl = {
  id: string;
  group: string;
  subject: string;
  preheader: string;
  body: string[];
  cta?: { label: string; href: string };
  footer: string;
};

const EMAILS: EmailTpl[] = [
  {
    id: "transactional-reading-saved",
    group: "Transakční",
    subject: "Tvůj výklad je uložený",
    preheader: "Kdykoli se k němu vrátíš jedním klikem.",
    body: [
      "Ahoj,",
      "tvůj výklad k otázce „{otazka}“ je bezpečně uložený. Nikam nezmizí a uvidíš ho jen ty.",
      "Kdykoli se k němu chceš vrátit, stačí kliknout na tlačítko níž. Žádné heslo nepotřebuješ.",
    ],
    cta: { label: "Otevřít můj výklad", href: "https://tarotolasce.cz/vyklad/{id}" },
    footer: FOOTER_TRANSACTIONAL,
  },
  {
    id: "transactional-otp",
    group: "Transakční",
    subject: "Tvůj kód pro Tarot o Lásce: {kod}",
    preheader: "Platí deset minut a jen jednou.",
    body: [
      "Tady je tvůj přihlašovací kód. Platí deset minut a jen jednou.",
      "Kód najdeš v předmětu tohohle e-mailu, nemusíš nic hledat.",
      "Pokud sis ho nevyžádala, klidně tenhle e-mail ignoruj.",
    ],
    footer: FOOTER_TRANSACTIONAL,
  },
  {
    id: "transactional-purchase",
    group: "Transakční",
    subject: "Tvůj výklad od AI kartářky {persona}",
    preheader: "Trvalý odkaz na tvůj výklad.",
    body: [
      "Ahoj,",
      "tady je trvalý odkaz na tvůj výklad. Nikam nezmizí a uvidíš ho jen ty.",
      "Ke svému účtu se kdykoli přihlásíš kódem - stačí e-mail.",
    ],
    cta: { label: "Otevřít můj výklad", href: "https://tarotolasce.cz/vyklad/{id}" },
    footer: FOOTER_TRANSACTIONAL,
  },
  {
    id: "daily-card",
    group: "Karta dne",
    subject: "Tvoje dnešní karta: {karta}",
    preheader: "Krátký vzkaz pro tvůj den.",
    body: [
      "Dobré ráno,",
      "dnešní karta pro tebe je {karta}.",
      "{kratky_vyklad_karty_dne}",
      "Jestli dnes nosíš v hlavě něco vlastního, karty jsou ti k dispozici.",
    ],
    cta: { label: "Otevřít kartu dne", href: "https://tarotolasce.cz/karta-dne" },
    footer: FOOTER_MARKETING,
  },
  // Sekvence A: po prvním zaplaceném výkladu
  {
    id: "seq-a-d1",
    group: "Sekvence A (po prvním výkladu) · D+1",
    subject: "Jak na tebe výklad dosedl?",
    preheader: "Den poté bývá nejlepší čas si ho přečíst znovu.",
    body: [
      "Ahoj,",
      "včera sis vyložila karty k otázce „{otazka}“. Den poté bývá nejlepší čas si výklad přečíst znovu. S odstupem si v něm často všimneš věty, která ti včera proklouzla.",
      "Tvůj výklad je pořád uložený a počká na tebe.",
    ],
    cta: { label: "Přečíst si výklad znovu", href: "https://tarotolasce.cz/vyklad/{id}" },
    footer: FOOTER_MARKETING,
  },
  {
    id: "seq-a-d3",
    group: "Sekvence A (po prvním výkladu) · D+3",
    subject: "Malý úkol z tvých karet",
    preheader: "Jedna věc, kterou si z výkladu můžeš odnést do života.",
    body: [
      "Ahoj,",
      "ve tvém výkladu byl jeden malý úkol. Jestli na něj nedošlo, nevadí, nikam neutekl. Zkus si na něj dnes najít pět minut. Malé kroky drží nejdéle.",
      "A jestli se ti od té doby v hlavě objevila nová otázka, karty jsou tu.",
    ],
    cta: { label: "Položit novou otázku", href: "https://tarotolasce.cz/vyklad/novy" },
    footer: FOOTER_MARKETING,
  },
  {
    id: "seq-a-d8",
    group: "Sekvence A (po prvním výkladu) · D+8",
    subject: "Týden poté: co se změnilo?",
    preheader: "Karta dne je tu pro tebe každé ráno zdarma.",
    body: [
      "Ahoj,",
      "od tvého výkladu uplynul týden. Někdy se za týden změní hodně, někdy nic, a obojí je v pořádku. Jestli chceš mít karty po ruce každý den, karta dne je zdarma a zabere minutku.",
      "A když se otázky začnou vracet častěji, balíček 5 výkladů za 199 Kč vychází na 40 Kč za výklad.",
    ],
    cta: { label: "Otočit dnešní kartu", href: "https://tarotolasce.cz/karta-dne" },
    footer: FOOTER_MARKETING,
  },
  // Sekvence B: zadala otázku, nedokončila platbu
  {
    id: "seq-b-d1",
    group: "Sekvence B (nedokončený výklad) · D+1",
    subject: "Tvoje karty jsou pořád připravené",
    preheader: "Otázka i rozklad na tebe čekají.",
    body: [
      "Ahoj,",
      "včera ses ptala: „{otazka}“. K výkladu nakonec nedošlo, ale tvoje karty jsou pořád zamíchané a připravené.",
      "Jestli ta otázka pořád žije, dokončíš to za dvě minuty. Jestli už ne, taky dobře. Nikam tě netlačíme.",
    ],
    cta: { label: "Dokončit výklad", href: "https://tarotolasce.cz/vyklad/novy?q={otazka}" },
    footer: FOOTER_MARKETING,
  },
  {
    id: "seq-b-d3",
    group: "Sekvence B (nedokončený výklad) · D+3",
    subject: "Mezitím: karta dne zdarma",
    preheader: "Jedna karta, žádné placení.",
    body: [
      "Ahoj,",
      "jestli si nejsi jistá, jestli je výklad pro tebe, zkus nejdřív kartu dne. Je zdarma, zabere minutku a uvidíš, jak se s kartami u nás pracuje.",
    ],
    cta: { label: "Otočit kartu dne", href: "https://tarotolasce.cz/karta-dne" },
    footer: FOOTER_MARKETING,
  },
  {
    id: "seq-b-d8",
    group: "Sekvence B (nedokončený výklad) · D+8",
    subject: "Poslední připomínka, slibujeme",
    preheader: "První výklad za 29 Kč, s garancí vrácení peněz.",
    body: [
      "Ahoj,",
      "tohle je poslední e-mail k tvé rozdělané otázce, pak už dáme pokoj.",
      "Jen pro jistotu: první výklad stojí 29 Kč a pokud ti nic nedá, napiš nám a peníze ti vrátíme. Tvoje otázka je u nás pořád uložená.",
    ],
    cta: { label: "Dokončit výklad za 29 Kč", href: "https://tarotolasce.cz/vyklad/novy?q={otazka}" },
    footer: FOOTER_MARKETING,
  },
];

export default function DevEmailsPage() {
  return (
    <div className="py-10">
      <h1 className="font-display text-[42px] leading-[1.1] font-semibold text-body">
        Náhledy e-mailů (dev)
      </h1>
      <p className="mt-3 text-sm text-body-dim">
        Mock režim: e-maily se nikam neposílají. Proměnné ve složených
        závorkách doplní produkční systém.
      </p>

      <div className="mt-10 space-y-10">
        {EMAILS.map((e) => (
          <section key={e.id}>
            <h2 className="text-xs uppercase tracking-wider text-accent-soft">
              {e.group}
            </h2>
            <div className="mt-2 overflow-hidden rounded-2xl border border-surface">
              <div className="border-b border-surface bg-surface px-5 py-3 text-sm">
                <p className="text-body">
                  <span className="text-body-dim">Předmět:</span> {e.subject}
                </p>
                <p className="mt-1 text-xs text-body-dim">
                  Preheader: {e.preheader}
                </p>
              </div>
              <div className="bg-cream px-6 py-6 text-plum-900">
                <p className="font-display text-lg font-semibold">
                  Tarot <span className="text-accent-dim">o Lásce</span>
                </p>
                <div className="mt-4 space-y-3 text-sm leading-relaxed">
                  {e.body.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
                {e.cta && (
                  <div className="mt-5">
                    <span className="inline-block rounded-xl bg-night px-5 py-3 text-sm font-medium text-body">
                      {e.cta.label}
                    </span>
                    <p className="mt-1 text-[11px] text-plum-900/50">{e.cta.href}</p>
                  </div>
                )}
                <p className="mt-6 border-t border-night/15 pt-4 text-[11px] leading-relaxed text-plum-900/55">
                  {e.footer}
                </p>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
