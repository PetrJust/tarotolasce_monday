/** @type {import('next').NextConfig} */
const nextConfig = {
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
