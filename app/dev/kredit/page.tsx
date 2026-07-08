"use client";
// Testovací panel pro simulaci nákupu kreditu/balíčku BEZ server-side
// ledgeru (viz lib/flags.ts). Přepínač tady mění chování jen ve tvém
// prohlížeči (cookie tol_dev_credits) - ostatním návštěvníkům zůstávají
// balíčky vypnuté (env výchozí), dokud nebude hotový skutečný účet.
// Stránka je noindex, viz layout.tsx v této složce.
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getDevCreditsOverride,
  setDevCreditsOverride,
  useCreditsEnabled,
  CREDITS_ENV_DEFAULT,
} from "@/lib/flags";
import {
  getCredits, setCredits, getSinglePurchases, bumpSinglePurchases,
  getFirstDone, setFirstDone, getReadingCount, setEmail,
} from "@/lib/clientState";
import { PRICES } from "@/lib/pricing";

const PACKS = [
  { label: "5 výkladů", credits: 5, price: PRICES.pack5 },
  { label: "20 výkladů", credits: 20, price: PRICES.pack20 },
];

export default function DevKreditPage() {
  const creditsEnabled = useCreditsEnabled();
  const [override, setOverride] = useState<boolean | null>(null);
  const [credits, setCreditsState] = useState(0);
  const [singles, setSingles] = useState(0);
  const [firstDone, setFirstDoneState] = useState(false);
  const [reads, setReads] = useState(0);

  function refresh() {
    setOverride(getDevCreditsOverride());
    setCreditsState(getCredits());
    setSingles(getSinglePurchases());
    setFirstDoneState(getFirstDone());
    setReads(getReadingCount());
  }
  useEffect(refresh, []);

  return (
    <div className="py-12">
      <h1 className="font-display text-[42px] leading-[1.1] font-semibold text-body">
        Testovací panel: kredit a balíčky
      </h1>
      <p className="mt-3 max-w-xl text-body-dim">
        Kredit a balíčky jsou v produkci schované, dokud nebude hotový
        server-side ledger (viz ceník). Tady si zapneš mock chování jen pro
        sebe a nasimuluješ nákup, ať vidíš, jak bude appka fungovat, až
        ledger dorazí.
      </p>

      <div className="mt-8 rounded-2xl border border-surface bg-surface p-6">
        <p className="text-xs uppercase tracking-wider text-body-dim">Stav teď</p>
        <p className="mt-1 text-body">
          Env výchozí: <strong>{CREDITS_ENV_DEFAULT ? "zapnuto" : "vypnuto"}</strong>
          {" · "}Tvůj override: <strong>{override === null ? "žádný" : override ? "zapnuto" : "vypnuto"}</strong>
          {" · "}Aktuálně platí: <strong>{creditsEnabled ? "ZAPNUTO" : "VYPNUTO"}</strong>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => { setDevCreditsOverride(true); refresh(); }}
            className="rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-night-deep hover:opacity-90"
          >
            Zapnout jen mně
          </button>
          <button
            onClick={() => { setDevCreditsOverride(false); refresh(); }}
            className="rounded-xl border border-surface px-4 py-2 text-sm text-body hover:border-accent-dim"
          >
            Vypnout jen mně
          </button>
          <button
            onClick={() => { setDevCreditsOverride(null); refresh(); }}
            className="rounded-xl border border-surface px-4 py-2 text-sm text-body-dim hover:border-accent-dim"
          >
            Smazat override (vrátit na výchozí)
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-surface bg-surface p-6">
        <p className="text-xs uppercase tracking-wider text-body-dim">Mock stav účtu</p>
        <p className="mt-1 text-body">
          Kredit: <strong>{credits}</strong> · Jednotlivé nákupy: <strong>{singles}</strong> ·
          {" "}První výklad využit: <strong>{firstDone ? "ano" : "ne"}</strong> ·
          {" "}Výklady celkem: <strong>{reads}</strong>
        </p>

        <p className="mt-4 text-sm font-medium text-body">Nasimulovat nákup balíčku</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PACKS.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setEmail("test@tarotolasce.cz");
                setCredits(getCredits() + p.credits);
                refresh();
              }}
              disabled={!creditsEnabled}
              className="rounded-xl border border-accent-dim px-4 py-2 text-sm text-accent-soft hover:border-accent disabled:opacity-40"
            >
              + {p.label} ({p.price} Kč)
            </button>
          ))}
          <button
            onClick={() => { bumpSinglePurchases(); refresh(); }}
            className="rounded-xl border border-surface px-4 py-2 text-sm text-body hover:border-accent-dim"
          >
            + jednotlivý nákup
          </button>
          <button
            onClick={() => { setFirstDone(); refresh(); }}
            className="rounded-xl border border-surface px-4 py-2 text-sm text-body hover:border-accent-dim"
          >
            Označit „první výklad hotov"
          </button>
        </div>

        <p className="mt-4 text-sm font-medium text-body">Reset</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={() => { setCredits(0); refresh(); }}
            className="rounded-xl border border-surface px-4 py-2 text-sm text-body-dim hover:border-accent-dim"
          >
            Vynulovat kredit
          </button>
        </div>
        {!creditsEnabled && (
          <p className="mt-3 text-xs text-body-dim">
            Tlačítka na simulaci nákupu jsou neaktivní, dokud výš nezapneš
            „Zapnout jen mně".
          </p>
        )}
      </div>

      <p className="mt-6 text-sm text-body-dim">
        Až budeš mít override zapnutý, jdi normálně nakoupit na{" "}
        <Link href="/cenik" className="text-accent-soft underline underline-offset-2 hover:text-accent">
          ceník
        </Link>{" "}
        - tlačítko „Koupit balíček" teď skutečně projde a připíše kredit,
        stejně jako tady. Ceník i tenhle panel čtou stejná mock data.
      </p>
    </div>
  );
}
