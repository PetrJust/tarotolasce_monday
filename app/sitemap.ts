// Generovaná sitemap (kapitola 10.6): jen veřejné stránky.
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { CARD_LIBRARY } from "@/lib/cardLibrary";
import { INTENTS } from "@/lib/intents";

const BASE = SITE_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    "",
    "/karta-dne",
    "/kontakt",
    "/vyznamy-karet",
    "/cenik",
    "/obchodni-podminky",
    "/ochrana-osobnich-udaju",
  ].map((p) => ({
    url: `${BASE}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));

  // Knihovna významů (v1.6.2): všech 78 karet má plný schválený obsah.
  const cardPages = CARD_LIBRARY.map((c) => ({
    url: `${BASE}/vyznamy-karet/${c.slug}`,
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
