import { DISCLAIMER } from "@/lib/site";
import { TolSeal } from "@/components/LogoSymbol";
import { PERSONA_FULL } from "@/lib/persona";
import Link from "next/link";
import { OPERATOR, OPERATOR_ICO, CONTACT_EMAIL } from "@/lib/site";

// Rozhodnutí zakladatele: tmavá noční fialová zůstává JEN tady, ve
// Footeru. Zbytek aplikace je světlý (viz app/globals.css). Proto Footer
// nepoužívá sémantické bg-surface/text-body třídy (ty by teď zdědily
// světlé hodnoty z :root) - má vlastní natvrdo tmavé barvy, podobně jako
// CrisisScreen má vlastní natvrdo bg-night-deep, nezávisle na okolí.
export default function Footer() {
  return (
    <footer className="border-t border-night-line bg-night-deep px-4 py-10 text-sm text-cream-dim">
      <div className="mx-auto max-w-3xl space-y-4">
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/cenik" className="hover:text-cream">Ceník</Link>
          <Link href="/vyznam-karet" className="hover:text-cream">Významy karet</Link>
          <Link href="/karta-dne" className="hover:text-cream">Karta dne</Link>
          <Link href="/kontakt" className="hover:text-cream">Kontakt</Link>
          <Link href="/obchodni-podminky" className="hover:text-cream">Obchodní podmínky</Link>
          <Link href="/ochrana-osobnich-udaju" className="hover:text-cream">Ochrana osobních údajů</Link>
        </nav>
        <p>
          18+ · Všechny výklady vytváří {PERSONA_FULL} · Provozovatel: {OPERATOR}{OPERATOR_ICO ? `, IČO: ${OPERATOR_ICO}` : ""} · <a href={`mailto:${CONTACT_EMAIL}`} className="text-rose-500 hover:text-cream">{CONTACT_EMAIL}</a>
        </p>
        <p>{DISCLAIMER}</p>
        {/* Submark patičky: pečeť TOL (v1.5 §5.8) */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
          <TolSeal size={22} />
        </div>
      </div>
    </footer>
  );
}
