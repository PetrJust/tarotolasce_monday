import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Karta dne zdarma: tvůj denní tarotový vzkaz",
  description:
    "Vytáhni si zdarma svou kartu dne. Jedna karta a krátký vzkaz pro tvoje srdce, každý den nový. Bez registrace a bez placení.",
  alternates: { canonical: "https://tarotolasce.cz/karta-dne" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
