"use client";
// 7.6 SPIRIO CTA. UTM: utm_source=tarotolasce&utm_medium=referral
// &utm_content={spread}_{umisteni}
export function spirioUrl(spread: string, placement: string): string {
  const params = new URLSearchParams({
    utm_source: "tarotolasce",
    utm_medium: "referral",
    utm_campaign: "post_reading",
    utm_content: `${spread}_${placement}`,
  });
  return `https://spirio.cz/landing-TBD?${params.toString()}`;
}

import { logEvent } from "@/lib/analytics";
import { getReadingCount } from "@/lib/clientState";

export default function SpirioCTA({
  spread,
  placement,
  prominent = false,
}: {
  spread: string;
  placement: string;
  prominent?: boolean;
}) {
  const href = spirioUrl(spread, placement);
  const onClick = () =>
    logEvent("spirio_click", { placement, spread, readings: getReadingCount() });

  if (prominent) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-accent/60 bg-surface p-6 shadow-card">
        {/* Spirio linka (plochá rose-500; invariant 3: žádný gradient) */}
        <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-rose-500" />
        <h3 className="font-display text-2xl font-semibold text-body">
          Tohle pouto se nerozváže samo.
        </h3>
        {/* v1.3 §3.10: copy DOSLOVA */}
        <p className="mt-3 text-body-dim">
          AI výklad ti dá první vhled. Pokud chceš živý rozhovor, ověřené
          průvodkyně na Spirio tě vyslechnou přes chat nebo hovor.
        </p>
        <a
          href={href}
          onClick={onClick}
          className="mt-5 inline-block rounded-xl bg-rose-500 px-6 py-3 font-medium text-plum-900 hover:opacity-90"
        >
          Promluvit si s průvodkyní
        </a>
        <p className="mt-3 text-xs text-body-dim">
          4,8 z 5 ★ · 14 000+ sezení · Čas se počítá až od připojení průvodkyně
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-surface bg-surface p-5">
      {/* Spirio linka (plochá rose-500; invariant 3: žádný gradient) */}
      <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-rose-500" />
      <h3 className="font-display text-xl font-semibold text-body">
        Chceš to probrat s živým člověkem?
      </h3>
      {/* v1.3 §3.10: copy DOSLOVA */}
      <p className="mt-2 text-sm text-body-dim">
        AI výklad ti dá první vhled. Pokud chceš živý rozhovor, ověřené
        průvodkyně na Spirio tě vyslechnou přes chat nebo hovor.
      </p>
      <a
        href={href}
        onClick={onClick}
        className="mt-4 inline-block rounded-xl border border-accent-dim px-5 py-2.5 text-sm text-accent-soft hover:border-accent"
      >
        Vybrat průvodkyni na Spirio
      </a>
      <p className="mt-3 text-xs text-body-dim">
        4,8 z 5 ★ · 14 000+ sezení · Čas se počítá až od připojení průvodkyně
      </p>
    </div>
  );
}
