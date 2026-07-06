// Intent landing pages: /vrati-se-ex, /co-ke-mne-citi, /mam-mu-napsat
export type IntentPage = {
  slug: string;
  h1: string;
  title: string;
  description: string;
  intro: string[];
  howTarotHelps: string[];
  faq: { q: string; a: string }[];
  suggestedQuestion: string;
};

export const INTENTS: IntentPage[] = [
  {
    slug: "vrati-se-ex",
    h1: "Vrátí se mi ex?",
    title: "Vrátí se mi ex? Tarotový výklad o lásce",
    description:
      "Otázka, která nedá spát. Tarot ti nepoví budoucnost, ale pomůže ti pochopit, co tě na něm pořád drží a co s tím můžeš udělat ty.",
    intro: [
      "Tahle otázka přichází nejčastěji v noci. Když je ticho a hlava si přehrává všechno, co bylo. Jestli ji právě teď nosíš v sobě, nejsi v tom sama.",
      "Rovnou na začátek poctivě: žádné karty ti nepoví, co udělá druhý člověk. To neví nikdo, ani on sám. Co ale karty umí, je ukázat ti, co se děje v tobě. Proč na něj pořád myslíš, co mezi vámi zůstalo nedořešené a co potřebuješ ty, ať už se vrátí, nebo ne.",
    ],
    howTarotHelps: [
      "Tarot je nástroj reflexe. Rozklad Já a můj ex prochází šest míst tvého příběhu: co zůstalo nevyřčené, proč se to stalo, co tě stále drží, co musíš pustit, jakou lekci si odnášíš a co tě čeká, když uvolníš místo.",
      "Nejde o věštbu. Jde o to, podívat se na vlastní situaci z odstupu, pojmenovat, co cítíš, a najít první malý krok. Někdy je to úleva. Někdy je to aha moment. Vždycky je to chvíle jen pro tebe.",
    ],
    faq: [
      {
        q: "Řekne mi výklad, jestli se ex vrátí?",
        a: "Ne. Žádný poctivý výklad nepředpovídá chování druhého člověka. Výklad ti pomůže pochopit, co tě na vztahu drží, co zůstalo nedořešené a co potřebuješ ty sama, ať se stane cokoli.",
      },
      {
        q: "Jak výklad probíhá?",
        a: "Napíšeš svou otázku, vybereš si karty z vějíře a dostaneš personalizovaný výklad. Celé to zabere pár minut a výklad ti zůstane uložený, můžeš se k němu kdykoli vrátit.",
      },
      {
        q: "Kolik to stojí?",
        a: "První výklad stojí 29 Kč. Pokud ti nic nedá, napiš nám a peníze ti vrátíme.",
      },
    ],
    suggestedQuestion: "Co mě na mém ex pořád drží?",
  },
  {
    slug: "co-ke-mne-citi",
    h1: "Co ke mně cítí?",
    title: "Co ke mně cítí? Tarotový výklad o vztahu",
    description:
      "Když nevíš, na čem jsi. Tarotový rozklad Jak to mezi námi je ti pomůže podívat se na vztah z odstupu a pojmenovat, co se mezi vámi děje.",
    intro: [
      "Nejistota je jedna z nejtěžších věcí ve vztahu. Číst zprávy pořád dokola, hledat významy mezi řádky, nevědět, na čem jsi. Pokud to znáš, tahle stránka je pro tebe.",
      "Karty neumí nahlédnout do hlavy druhého člověka. Co umí, je pomoct ti srovnat si, co vidíš, co cítíš a co si možná jen přeješ vidět. To je často přesně to, co potřebuješ, aby ses mohla rozhodnout, jak dál.",
    ],
    howTarotHelps: [
      "Rozklad Jak to mezi námi je má tři karty: Já, On a My. Podíváš se na svoji energii ve vztahu, na to, jak se jeví jeho strana, a na to, co tvoříte spolu.",
      "Výsledkem není verdikt, ale zrcadlo. Často ti dojde něco, co jsi vlastně věděla, jen sis to ještě neřekla nahlas.",
    ],
    faq: [
      {
        q: "Pozná výklad, co si druhý člověk doopravdy myslí?",
        a: "Ne, a nikdo to nepozná. Výklad pracuje s tím, co do něj vneseš ty: tvoji otázku, tvoje vnímání situace. Pomůže ti to uspořádat a podívat se na to z nového úhlu.",
      },
      {
        q: "Co když mi výklad nic neřekne?",
        a: "Pokud ti první výklad nic nedá, napiš nám a 29 Kč ti vrátíme. Bez dotazů a bez řečí.",
      },
      {
        q: "Uvidí někdo moji otázku?",
        a: "Tvoje otázka i výklad jsou jen tvoje. Ukládají se k tvému e-mailu, aby ses k nim mohla vrátit, a nikde jinde se nezobrazují.",
      },
    ],
    suggestedQuestion: "Jak to mezi námi teď doopravdy je?",
  },
  {
    slug: "mam-mu-napsat",
    h1: "Mám mu napsat?",
    title: "Mám mu napsat? Tarot Ano/Ne pro srdce",
    description:
      "Prst nad odeslat a hlava plná pochybností. Jednokaretní tarotový výklad ti pomůže zastavit se a zjistit, odkud tvoje chuť napsat vlastně přichází.",
    intro: [
      "Znáš to. Zpráva je napsaná, palec visí nad tlačítkem a ty nevíš. Napsat, nebo vydržet? Ozvat se, nebo nechat být?",
      "Tahle otázka většinou není o něm. Je o tom, co se děje v tobě: jestli píšeš z klidu, nebo z úzkosti. A přesně na to se umí podívat jedna karta.",
    ],
    howTarotHelps: [
      "Rozklad Ano/Ne pro srdce je jedna karta a jedna odpověď. Ne příkaz, ale impuls k zastavení. Karta ti ukáže, jaká energie tvoji otázku právě teď doprovází.",
      "Někdy je odpověď spíš ano: piš, ale s klidem. Někdy spíš ne: počkej, až nebude rozhodovat úzkost. V obou případech rozhodnutí zůstává na tobě.",
    ],
    faq: [
      {
        q: "Opravdu mi jedna karta odpoví?",
        a: "Jedna karta ti dá směr a impuls k zamyšlení, ne rozkaz. Výklad vždy vysvětlí, proč karta ukazuje spíš ano nebo spíš ne, a co s tím můžeš udělat.",
      },
      {
        q: "Co když s odpovědí nesouhlasím?",
        a: "To je v pořádku a je to cenná informace. Pokud tě odpověď zklamala, právě ses dozvěděla, co sis doopravdy přála. I to je k něčemu.",
      },
      {
        q: "Kolik výklad stojí?",
        a: "První výklad stojí 29 Kč, další 49 Kč. Výhodnější balíčky najdeš v ceníku.",
      },
    ],
    suggestedQuestion: "Mám mu napsat?",
  },
];

export const INTENT_BY_SLUG = Object.fromEntries(INTENTS.map((i) => [i.slug, i]));
