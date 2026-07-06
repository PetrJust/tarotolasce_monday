import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Výklad",
  robots: { index: false, follow: false },
};

// Rozhodnutí zakladatele: celá aplikace je světlá, včetně živého rituálu
// a výkladu (nahrazuje dřívější §2 zadání paleta). Tmavá noční fialová
// zůstává jen ve Footeru. Dědí světlou výchozí polohu z :root, žádný
// vlastní scope zde není potřeba.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
