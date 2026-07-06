"use client";
// 7.3 Konec výkladu: 3 cesty. Cesta 2 je SPIRIO CTA.
// Navíc: „Cesta k průvodkyni" (tichý ukazatel + dárek po 10. výkladu)
// a jemná brzda při 3+ výkladech za den. Vše bez dark patterns:
// dárek je dárek, brzda je péče, nic neblokujeme.
import { useEffect, useState } from "react";
import Link from "next/link";
import SpirioCTA, { spirioUrl } from "./SpirioCTA";
import { vykladu } from "@/lib/declension";
import {
  getReadingCount, isGuideGiftUsed, setGuideGiftUsed,
} from "@/lib/clientState";
import { useCreditsEnabled } from "@/lib/flags";
import { logEvent } from "@/lib/analytics";

const GIFT_AT = 10; // po kolikátém výkladu se otevře dárek

export default function ThreePaths({
  spread,
  credits,
  singlePurchases,
}: {
  spread: string;
  credits: number;
  singlePurchases: number;
}) {
  const prominent = spread === "my_ex";
  const creditsEnabled = useCreditsEnabled();
  const [reads, setReads] = useState(0);
  const [giftUsed, setGiftUsed] = useState(true); // než se načte, nic neukazuj

  useEffect(() => {
    setReads(getReadingCount());
    setGiftUsed(isGuideGiftUsed());
  }, []);

  const giftOpen = reads >= GIFT_AT && !giftUsed;

  return (
    <section className="mt-12 space-y-5">
      <h2 className="font-display text-[32px] leading-[1.15] font-semibold text-body">Co dál?</h2>

      {/* DÁREK: Cesta k průvodkyni dokončena (MOCK: v produkci se voucher
          uplatní přes Spirio; tady jen odkaz s UTM a poděkování) */}
      {giftOpen && (
        <div className="relative overflow-hidden rounded-2xl border border-accent/60 bg-surface p-5 shadow-[0_0_32px_rgba(240,66,110,0.18)]">
          <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-rose-500" />
          <p className="text-[11px] uppercase tracking-wider text-accent-soft">
            Průvodkyně · dárek pro tebe
          </p>
          <h3 className="mt-1 font-display text-2xl font-semibold text-body">
            Máš u nás dárek.
          </h3>
          <p className="mt-2 text-sm text-body-dim">
            Ptala ses karet už desetkrát. Některé otázky si zaslouží živého
            člověka. Vyber si průvodkyni na Spiriu a prvních 10 minut máš od
            nás zdarma. Bez podmínek, jen jako poděkování.
          </p>
          <a
            href={spirioUrl(spread, "cesta10")}
            onClick={() => {
              logEvent("spirio_click", { placement: "cesta10", spread, readings: reads });
              setGuideGiftUsed();
              setGiftUsed(true);
            }}
            className="mt-4 inline-block rounded-xl bg-rose-500 px-6 py-3 font-semibold text-plum-900 transition hover:opacity-90"
          >
            Vybrat průvodkyni · 10 minut zdarma
          </a>
          <p className="mt-3 text-[11px] text-body-dim">
            Průvodkyně jako Tinja nebo Berkana · 4,8 z 5 ★ · Garance vrácení peněz.
            Čas se počítá až od připojení průvodkyně.
          </p>
        </div>
      )}

      {/* Cesta 1 (F.7 + v1.3 §1: primární CTA plum-900, cena drobně pod) */}
      <div className="rounded-2xl border border-surface bg-surface p-5">
        <a
          href="/vyklad/novy"
          className="btn-primary"
        >
          Chceš se zeptat ještě na něco?
        </a>
        <p className="mt-2 text-sm text-body-dim lining-nums-price">
          {creditsEnabled && credits > 0
            ? `Z tvého balíčku · zbývá ${vykladu(credits)}`
            : "49 Kč za výklad"}
        </p>
      </div>

      {/* Cesta 2: Spirio */}
      <SpirioCTA spread={spread} placement="3cesty" prominent={prominent} />

      {/* Tichý ukazatel cesty (jen když dárek ještě čeká) */}
      {!giftOpen && !giftUsed && reads > 0 && (
        <div className="flex items-center justify-center gap-2 pt-1" title="Průvodkyně">
          <div className="flex gap-1.5" aria-hidden="true">
            {Array.from({ length: GIFT_AT }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${
                  i < reads ? "bg-rose-500" : "bg-rose-500/20"
                }`}
              />
            ))}
          </div>
          <span className="text-[11px] text-body-dim">
            Průvodkyně · {Math.min(reads, GIFT_AT)} z {GIFT_AT}
          </span>
        </div>
      )}

      {/* Cesta 3 */}
      <div className="rounded-2xl border border-surface bg-surface p-5">
        <Link
          href="/historie"
          className="font-display text-xl font-semibold text-body hover:text-accent-soft"
        >
          Nechat si to na potom
        </Link>
        <p className="mt-2 text-sm text-body-dim">
          Výklad zůstává uložený. Kdykoli se k němu vrátíš ve své historii.
        </p>
      </div>

      {/* Banner po 2. jednotlivém nákupu */}
      {creditsEnabled && singlePurchases >= 2 && (
        <div className="rounded-2xl border border-accent-dim/50 bg-surface p-5">
          <p className="text-body-dim">
            Ptáš se ráda? 5 výkladů za 199 Kč vychází na 40 Kč za výklad.{" "}
            <Link href="/cenik" className="font-medium text-accent-soft hover:text-accent">
              Vybrat balíček
            </Link>
          </p>
        </div>
      )}
    </section>
  );
}
