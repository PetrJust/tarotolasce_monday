"use client";
// „Co dál?" po odemčení výkladu (v1.6 §7.12, copy DOSLOVA).
// Hierarchie: primární = další otázka; SPIRIO a historie sekundární.
// Timing mostu: od 1. výkladu; kontextový trigger platí.
// P2 (nestavět): „právě teď" nahradit reálným online indikátorem.
import Link from "next/link";
import { PRICES } from "@/lib/pricing";
import { logEvent } from "@/lib/analytics";
import { getReadingCount } from "@/lib/clientState";
import { SPIRIO_URL } from "@/lib/site";

export default function ThreePaths({
  spread,
  credits,
  singlePurchases,
}: {
  spread: string;
  credits: number;
  singlePurchases: number;
}) {
  void credits;
  void singlePurchases;
  const spirioHref = `${SPIRIO_URL}?utm_source=tarotolasce&utm_medium=app&utm_campaign=most-po-vykladu`;

  return (
    <section className="mt-10">
      <h2 className="font-display text-body">Co dál?</h2>

      {/* Primární: další otázka */}
      <div className="mt-5 rounded-2xl border border-surface bg-surface p-6">
        <p className="font-medium text-body">Máš ještě jednu otázku?</p>
        <p className="mt-1 text-sm text-body-dim">
          Můžeš se zeptat znovu. Nová otázka, nové karty, nový výklad.
        </p>
        <Link href="/vyklad/novy" className="btn-primary mt-4 w-full sm:w-auto">
          Položit další otázku
        </Link>
        <p className="mt-2 text-xs text-body-dim lining-nums-price">
          Další výklad {PRICES.single} Kč
        </p>
      </div>

      {/* Sekundární: SPIRIO most */}
      <div className="mt-4 rounded-2xl border border-surface bg-surface p-6">
        <p className="font-medium text-body">Chceš výklad od skutečné kartářky?</p>
        <p className="mt-1 text-sm text-body-dim">
          Na SPIRIO se můžeš spojit s ověřenými kartářkami a průvodkyněmi
          právě teď.
        </p>
        <a
          href={spirioHref}
          target="_blank"
          rel="noopener"
          onClick={() =>
            logEvent("spirio_click", {
              source: "most-po-vykladu",
              spread,
              readings: getReadingCount(),
            })
          }
          className="mt-4 inline-flex items-center justify-center rounded-[22px] border-2 border-rose-500 px-6 py-3 font-bold text-accent-soft hover:border-accent hover:text-accent"
        >
          Vybrat průvodkyni na Spirio
        </a>
        <p className="mt-3 text-xs text-body-dim">
          4,8 z 5 ★ · 14 000+ sezení · 40+ průvodkyň a průvodců · Čas se
          počítá až od připojení průvodkyně
        </p>
      </div>

      {/* Sekundární: historie */}
      <div className="mt-4 rounded-2xl border border-surface bg-surface p-6">
        <p className="font-medium text-body">Vrátit se k výkladu později</p>
        <p className="mt-1 text-sm text-body-dim">Výklad máš uložený v historii.</p>
        <Link
          href="/historie"
          className="mt-3 inline-block text-accent-soft underline underline-offset-2 hover:text-accent"
        >
          Otevřít historii
        </Link>
      </div>
    </section>
  );
}
