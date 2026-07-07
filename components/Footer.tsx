import { DISCLAIMER } from "@/lib/site";
import LogoSymbol from "@/components/LogoSymbol";
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
        {/* v1.6 §7.17: Reklamace míří na sekci OP (#reklamace) */}
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/obchodni-podminky" className="hover:text-cream">Obchodní podmínky</Link>
          <Link href="/ochrana-osobnich-udaju" className="hover:text-cream">Ochrana osobních údajů</Link>
          <Link href="/obchodni-podminky#reklamace" className="hover:text-cream">Reklamace</Link>
          <Link href="/kontakt" className="hover:text-cream">Kontakt</Link>
        </nav>
        <p>
          18+ · Výklady vytváří {PERSONA_FULL} · Provozovatel: {OPERATOR}{OPERATOR_ICO ? `, IČO: ${OPERATOR_ICO}` : ""} · <a href={`mailto:${CONTACT_EMAIL}`} className="text-rose-500 hover:text-cream">{CONTACT_EMAIL}</a>
        </p>
        <p>{DISCLAIMER}</p>
        {/* v1.6 §3: submark = symbol se srdcem */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
          <LogoSymbol size={24} />
        </div>
      </div>
    </footer>
  );
}
