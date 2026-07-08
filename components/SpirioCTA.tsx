"use client";
// SPIRIO CTA (v1.6 §8). Všechny odkazy na landing spirio.cz.
// UTM: utm_source=tarotolasce&utm_medium=app&utm_campaign={campaign}
// campaign ∈ {most-po-vykladu | profil | paticka}. Zpětně: placement
// „post_reading"→most-po-vykladu, „footer"→paticka, „profil"→profil.
const CAMPAIGN: Record<string, string> = {
  post_reading: "most-po-vykladu",
  cesta10: "most-po-vykladu",
  footer: "paticka",
  profil: "profil",
};
export function spirioUrl(spread: string, placement: string): string {
  const campaign = CAMPAIGN[placement] ?? "paticka";
  const params = new URLSearchParams({
    utm_source: "tarotolasce",
    utm_medium: "app",
    utm_campaign: campaign,
    utm_content: `${spread}_${placement}`,
  });
  return `https://spirio.cz?${params.toString()}`;
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
        {/* v1.5 §5.5: copy DOSLOVA včetně „právě teď" */}
        <p className="mt-3 text-body-dim">
          Chceš výklad od skutečné kartářky? Na SPIRIO se můžeš spojit s
          ověřenými kartářkami a průvodkyněmi právě teď.
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
      {/* v1.5 §5.5: copy DOSLOVA včetně „právě teď" */}
      <p className="mt-2 text-sm text-body-dim">
        Chceš výklad od skutečné kartářky? Na SPIRIO se můžeš spojit s
        ověřenými kartářkami a průvodkyněmi právě teď.
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
