// Ceník: 4 karty (v1.3 §4), Product JSON-LD (kapitola 10.3).
// SSR stránka, nákup balíčku řeší klientská komponenta níže.
import type { Metadata } from "next";
import BuyPack from "@/components/BuyPack";

export const metadata: Metadata = {
  title: "Ceník: tarotové výklady od 29 Kč",
  description:
    "První tarotový výklad za 29 Kč, jednotlivý za 49 Kč. Balíček 5 výkladů za 199 Kč nebo 20 výkladů za 599 Kč. Bez předplatného.",
  alternates: { canonical: "https://tarotolasce.cz/cenik" },
};

const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Tarotový výklad o lásce",
  description:
    "Osobní AI tarotový výklad o lásce a vztazích. Jednotlivé výklady i balíčky.",
  brand: { "@type": "Brand", name: "Tarot o Lásce" },
  offers: [
    {
      "@type": "Offer",
      name: "První výklad",
      price: "29",
      priceCurrency: "CZK",
      url: "https://tarotolasce.cz/cenik",
    },
    {
      "@type": "Offer",
      name: "Jednotlivý výklad",
      price: "49",
      priceCurrency: "CZK",
      url: "https://tarotolasce.cz/cenik",
    },
    {
      "@type": "Offer",
      name: "Balíček 5 výkladů",
      price: "199",
      priceCurrency: "CZK",
      url: "https://tarotolasce.cz/cenik",
    },
    {
      "@type": "Offer",
      name: "Balíček 20 výkladů",
      price: "599",
      priceCurrency: "CZK",
      url: "https://tarotolasce.cz/cenik",
    },
  ],
};

// v1.3 §4: finální ceník - ČTYŘI karty, žádný mezistav „Brzy".
// První dvě vedou do checkout flow, balíčky nakupují přes /api/checkout
// (zapojeno ve stejném nasazení jako ledger; pojistka = 6 ledger testů).
const TIERS = [
  {
    name: "První výklad",
    price: "29 Kč",
    note: "samostatná vstupní nabídka",
    detail: "Jedna otázka na zkoušku. Když ti nic nedá, vrátíme ti 29 Kč.",
    priceId: null,
    credits: 0,
  },
  {
    name: "1 výklad",
    price: "49 Kč",
    note: "bez předplatného",
    detail: "Jedna otázka, jeden rozklad, výklad uložený navždy.",
    priceId: null,
    credits: 0,
  },
  {
    name: "5 výkladů",
    price: "199 Kč",
    note: "vychází na 40 Kč za výklad",
    detail: "Pro chvíle, kdy se otázky vrací. Výklady nepropadají.",
    priceId: "price_pack5_199",
    credits: 5,
  },
  {
    name: "20 výkladů",
    price: "599 Kč",
    note: "vychází na 30 Kč za výklad",
    detail: "Pro tebe, když jsou karty tvůj večerní rituál.",
    priceId: "price_pack20_599",
    credits: 20,
  },
];

export default function CenikPage() {
  return (
    <div className="py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <h1 className="font-display text-[42px] leading-[1.1] font-semibold text-body">Ceník</h1>
      <p className="mt-4 max-w-xl text-body-dim">
        Žádné předplatné, žádné automatické strhávání. Platíš jen za výklady,
        které chceš. Pokud ti první výklad nic nedá, napiš nám a 29 Kč ti
        vrátíme.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className="flex flex-col rounded-2xl border border-surface bg-surface p-6"
          >
            <h2 className="font-display text-[30px] leading-[1.15] font-semibold text-body">
              {t.name}
            </h2>
            <p className="mt-2 font-display text-3xl text-accent-soft lining-nums-price">{t.price}</p>
            <p className="mt-1 text-xs text-body-dim">{t.note}</p>
            <p className="mt-4 flex-1 text-sm text-body-dim">{t.detail}</p>
            <BuyPack priceId={t.priceId} credits={t.credits} primary={t.name === "První výklad"} />
          </div>
        ))}
      </div>

      <p className="mt-8 text-xs text-body-dim">
        Karta dne je vždy zdarma. Výklady generuje AI.
      </p>
    </div>
  );
}
