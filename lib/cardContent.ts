// Obsah knihovny karet (/vyznam-karet/[slug])
// 5 karet plně napsaných, zbytek strukturovaný placeholder s TODO_CONTENT.
export type CardContent = {
  upright: string;
  reversed: string;
  forYourQuestion: string;
  isPlaceholder?: boolean;
};

const FULL: Record<string, CardContent> = {
  zamilovani: {
    upright:
      "Zamilovaní jsou karta volby a souznění. V lásce mluví o vztahu, který má hloubku: dva lidé, kteří se vidí takoví, jací jsou. Když se objeví ve výkladu, často ukazuje na okamžik, kdy se rozhoduješ srdcem. Nejde jen o zamilovanost, ale o vědomé ano druhému člověku. Karta připomíná, že skutečná blízkost vzniká tam, kde si oba můžou dovolit být zranitelní.",
    reversed:
      "Obrácení Zamilovaní upozorňují na nesoulad mezi tím, co cítíš, a tím, co žiješ. Možná ve vztahu chybí rovnováha, možná se rozhoduješ ze strachu místo z lásky. Karta nevolá po útěku, ale po upřímnosti: nejdřív k sobě, pak k druhému. Zeptej se sama sebe, jestli volbu, ve které jsi, dělalo tvoje srdce, nebo tvůj strach z osamění.",
    forYourQuestion:
      "Pokud se ptáš na konkrétního člověka, Zamilovaní obrací pozornost k tvé vlastní volbě. Ne k tomu, co udělá on, ale k tomu, co chceš ty. Karta ti připomíná, že vztah je rozhodnutí, které se dělá každý den znovu. Dobrá otázka pro dnešek: kdybych si vybírala dnes poprvé, vybrala bych si tohle?",
  },
  vez: {
    upright:
      "Věž je karta náhlé změny. To, co stálo na nejistých základech, se hroutí, a i když to bolí, uvolňuje se tím místo pro něco pravdivějšího. V lásce Věž často provází rozchody, odhalení nebo momenty, kdy se iluze rozpadne. Není to trest. Je to úleva, která zatím bolí. Po Věži zůstává čistý prostor, ve kterém se dá stavět znovu a líp.",
    reversed:
      "Obrácená Věž mluví o změně, kterou oddaluješ. Něco uvnitř už ví, že takhle to dál nejde, ale držíš zdi, aby nespadly. Karta se ptá: kolik energie tě stojí udržovat něco, co už neslouží? Pád, kterému se bráníš, může být menší než vyčerpání z věčného podpírání.",
    forYourQuestion:
      "Když se Věž objeví u otázky na vztah, neznamená to automaticky konec. Znamená to, že něco ve vztahu nebo v tobě potřebuje projít proměnou, aby to mohlo být skutečné. Zkus si odpovědět: co by se stalo, kdybych přestala předstírat, že je všechno v pořádku?",
  },
  smrt: {
    upright:
      "Smrt je nejvíc nepochopená karta tarotu. Nemluví o konci života, ale o konci kapitoly. V lásce znamená uzavření cyklu: vztah, role nebo představa, která dozrála k proměně. Smrt přichází tam, kde se něco přežilo, a dělá místo novému. Je to karta hlubokého očištění. To, co odchází, si vzalo svůj čas, a to, co přijde, si ho taky vezme.",
    reversed:
      "Obrácená Smrt ukazuje na lpění. Konec už nastal, ale ty ho ještě nepřijala. Možná držíš vztah, který už skončil, možná představu o sobě, která už neplatí. Karta neříká, že máš něco násilně utnout. Říká, že smutek potřebuje projít, ne se obejít. Dovol si truchlit pro to, co bylo, abys mohla uvidět, co je.",
    forYourQuestion:
      "U otázek na lásku Smrt obvykle označuje proměnu, kterou už cítíš, ale ještě jsi ji nepojmenovala. Něco mezi vámi nebo v tobě se mění. Místo otázky „skončí to?“ zkus otázku „co ve mně chce skončit, abych mohla žít dál?“",
  },
  "dvojka-pohary": {
    upright:
      "Dvojka pohárů je karta vzájemnosti. Dva lidé, dva poháry, rovnováha dávání a přijímání. V lásce je to jedna z nejkrásnějších karet: mluví o spojení, které je oboustranné, o vztahu, kde se city potkávají. Když se objeví, ukazuje na skutečnou blízkost nebo na její možnost. Ne dokonalost, ale upřímné setkání dvou srdcí.",
    reversed:
      "Obrácená Dvojka pohárů upozorňuje na nerovnováhu. Jeden dává víc, druhý míň. Jeden čeká, druhý mlčí. Karta se ptá, jestli vztah, na který myslíš, stojí na vzájemnosti, nebo na tvé naději, že se vzájemným teprve stane. Láska, která teče jen jedním směrem, vyčerpává.",
    forYourQuestion:
      "Pokud se ptáš na city druhého člověka, Dvojka pohárů obrací otázku zpátky: jak vyrovnaná je výměna mezi vámi? Všímej si ne slov, ale toků. Kdo iniciuje, kdo odpovídá, kdo nese. Rovnováha se nedá vynutit, ale dá se pojmenovat.",
  },
  "trojka-mece": {
    upright:
      "Trojka mečů je karta bolesti srdce. Tři meče v srdci, déšť v pozadí. Zranění, zrada, ztráta nebo slova, která se nedají vzít zpět. Je to karta, kterou nikdo nechce vidět, a přitom je svým způsobem laskavá: pojmenovává bolest, kterou už stejně cítíš. A bolest, která má jméno, se dá unést líp než ta, která se tváří, že neexistuje.",
    reversed:
      "Obrácená Trojka mečů mluví o bolesti, která se hojí, nebo o bolesti, kterou potlačuješ. Rozdíl poznáš podle toho, jestli o ní dokážeš mluvit. Pokud ano, hojíš se. Pokud se jí vyhýbáš, čeká. Karta ti dává svolení cítit to, co cítíš, bez termínu, do kdy to máš mít zpracované.",
    forYourQuestion:
      "Když se Trojka mečů objeví u tvé otázky, neznamená to, že přijde další rána. Častěji ukazuje na bolest, kterou už neseš a která ovlivňuje, jak se ptáš. Zkus si položit otázku jinak: ne „přestane to bolet?“, ale „co moje bolest potřebuje, aby mohla začít odcházet?“",
  },
};

const PLACEHOLDER: CardContent = {
  upright:
    "TODO_CONTENT: Význam karty ve vzpřímené pozici se zaměřením na lásku a vztahy. 3 až 5 vět, tón klidný a reflektivní, bez predikcí.",
  reversed:
    "TODO_CONTENT: Význam karty v obrácené pozici se zaměřením na lásku a vztahy. 3 až 5 vět, tón klidný a reflektivní, bez predikcí.",
  forYourQuestion:
    "TODO_CONTENT: Co karta znamená pro otázku tazatelky. 2 až 4 věty, končí reflektivní otázkou.",
  isPlaceholder: true,
};

export function cardContent(slug: string): CardContent {
  return FULL[slug] ?? PLACEHOLDER;
}

// Jediný zdroj pravdy o tom, které karty mají plně napsaný obsah.
// Placeholder karty (TODO_CONTENT) se neindexují a nejsou v sitemap,
// dokud je obsahový tým nedoplní (jinak by tenké stránky kazily kvalitu domény).
export const WRITTEN_CARD_SLUGS = new Set(Object.keys(FULL));

export function hasFullContent(slug: string): boolean {
  return WRITTEN_CARD_SLUGS.has(slug);
}
