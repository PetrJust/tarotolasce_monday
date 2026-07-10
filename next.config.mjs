/** @type {import('next').NextConfig} */
const nextConfig = {
  // v1.5 §5.9: stránka Reklamace zrušena, obsah bude sekcí OP
  async redirects() {
    return [
      { source: "/reklamace", destination: "/obchodni-podminky", permanent: true },
      // v1.6.2: knihovna přesunuta na /vyznamy-karet (nové slugy dle názvů;
      // staré URL po id karet přesměrovat na rozcestník - 1:1 mapa id->slug
      // není nutná, rozcestník návštěvníka navede)
      { source: "/vyznam-karet", destination: "/vyznamy-karet", permanent: true },
      { source: "/vyznam-karet/:slug", destination: "/vyznamy-karet", permanent: true },
    ];
  },
  reactStrictMode: true,
  // Staging na *.vercel.app nesmí soupeřit s produkcí v indexu (v1 §12):
  // X-Robots-Tag: noindex pro vercel.app hosty; produkce tarotolasce.cz
  // hlavičku nedostane a má canonical.
  async headers() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "(?<host>.*\\.vercel\\.app)" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
};
export default nextConfig;
