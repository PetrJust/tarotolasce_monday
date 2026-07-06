// Generovaná sitemap (kapitola 10.6): jen veřejné stránky.
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { DECK } from "@/lib/cards";
import { hasFullContent } from "@/lib/cardContent";
import { INTENTS } from "@/lib/intents";

const BASE = SITE_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    "",
    "/karta-dne",
    "/kontakt",
    "/vyznam-karet",
    "/cenik",
    "/obchodni-podminky",
    "/ochrana-osobnich-udaju",
    "/reklamace",
  ].map((p) => ({
    url: `${BASE}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));

  // Jen karty s plně napsaným obsahem; placeholder (TODO_CONTENT) se přidají,
  // až budou doplněné, aby se neindexovaly tenké stránky.
  const cardPages = DECK.filter((c) => hasFullContent(c.id)).map((c) => ({
    url: `${BASE}/vyznam-karet/${c.id}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const intentPages = INTENTS.map((i) => ({
    url: `${BASE}/${i.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...intentPages, ...cardPages];
}
