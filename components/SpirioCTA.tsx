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
      <div className="relative overflow-hidden rounded-2xl border border-accent/60 bg-surface p-6 shadow-glow">
        {/* Podpisový Spirio gradient (viz prototyp spirio.cz) */}
        <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#3B0764] to-[#BE185D]" />
        <h3 className="font-display text-2xl font-semibold text-body">
          Tohle pouto se nerozváže samo.
        </h3>
        <p className="mt-3 text-body-dim">
          Karty ti ukázaly, co tě drží. Jestli to chceš doopravdy pustit, živá
          průvodkyně s tebou projde, co se dnes otevřelo. První výklad 10 minut
          za 99 Kč, s garancí vrácení peněz.
        </p>
        <a
          href={href}
          onClick={onClick}
          className="mt-5 inline-block rounded-xl bg-gold px-6 py-3 font-medium text-night hover:bg-gold-soft"
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
      {/* Podpisový Spirio gradient (viz prototyp spirio.cz) */}
      <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#3B0764] to-[#BE185D]" />
      <h3 className="font-display text-xl font-semibold text-body">
        Chceš to probrat s živým člověkem?
      </h3>
      <p className="mt-2 text-sm text-body-dim">
        Ověřené průvodkyně na Spirio tě vyslechnou přes chat nebo hovor. První
        výklad 10 minut za 99 Kč. Když ti nic nedá, peníze ti vrátíme.
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
