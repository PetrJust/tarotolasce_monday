"use client";
// CTA na konci každé stránky knihovny (v1.6.2 §3). Text fixní DOSLOVA
// (celá věta včetně jména karty přichází ze zdrojového souboru přes
// props). Proklikávací je POUZE „Nech si karty vyložit od Nomi".
// Dvě vizuální varianty přepínatelné query parametrem ?cta=link|pill
// [ČEKÁ NA ROMANA - vybere pohledem]; čte se klientsky, aby stránka
// zůstala plně statická (SSG - obsah v HTML, SEO). Výchozí = link.
// Cíl: obrazovka zadání otázky, žádná mezistránka. Klik loguje
// library_cta_click se slugem karty (měření od dne 1).
import Link from "next/link";
import { useEffect, useState } from "react";
import { logEvent } from "@/lib/analytics";

const LINK_TEXT = "Nech si karty vyložit od Nomi";

export default function LibraryCta({ cta, slug }: { cta: string; slug: string }) {
  // rozdělit fixní větu na otázku (běžný text) a odkazovou část
  const idx = cta.indexOf(LINK_TEXT);
  const question = idx === -1 ? cta : cta.slice(0, idx);
  const tail = idx === -1 ? "" : cta.slice(idx + LINK_TEXT.length); // tečka

  const [variant, setVariant] = useState<"link" | "pill">("link");
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("cta");
    if (v === "pill") setVariant("pill");
  }, []);

  const href = `/vyklad/novy?from=${slug}`;
  const onClick = () => logEvent("library_cta_click", { slug });

  return (
    <p className="mt-8 text-lg text-body">
      {question}
      {variant === "pill" ? (
        // (b) decentní pill: zaoblený rámeček v barvě značky, BEZ plné
        // výplně - vizuálně blíž odkazu než buttonu
        <Link
          href={href}
          onClick={onClick}
          className="ml-1 inline-block rounded-full border border-rose-500 px-4 py-1.5 text-accent-soft hover:border-accent hover:text-accent"
        >
          {LINK_TEXT}
        </Link>
      ) : (
        // (a) podtržený odkaz v AA odvozenině romantic-pink (text-accent-soft
        // = #A2366C, kontrast 5,3:1 dle v1.6 §3)
        <Link
          href={href}
          onClick={onClick}
          className="text-accent-soft underline underline-offset-2 hover:text-accent"
        >
          {LINK_TEXT}
        </Link>
      )}
      {tail}
    </p>
  );
}
