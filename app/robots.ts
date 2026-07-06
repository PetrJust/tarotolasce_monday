// robots.txt (kapitola 10.6): blokuje /vyklad, /historie, /dev
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/vyklad", "/historie", "/dev", "/prihlaseni", "/api"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
