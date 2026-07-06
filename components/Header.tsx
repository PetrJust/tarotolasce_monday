"use client";
// Mobilní header (v1.1 F.3): logo vlevo, účet vpravo, Ceník + Historie
// v hamburgeru. Stav přihlášení ze session (fix H.1: u přihlášené nikdy
// „Přihlásit se").
import Link from "next/link";
import { useState } from "react";
import CreditBadge from "./CreditBadge";
import { useSession } from "@/lib/useSession";
import { PERSONA_NAME } from "@/lib/persona";

export default function Header() {
  const { email, loading } = useSession();
  const [open, setOpen] = useState(false);
  const accountHref = email ? "/profil" : "/prihlaseni";
  const accountLabel = email ? "Profil" : "Přihlásit se";

  return (
    <header className="sticky top-0 z-40 border-b border-surface bg-surface-2 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        {/* Logo: font-logo = současný řez (Fraunces); Lora 600 vs. tenhle
            řez rozhodne zakladatel pohledem (v1.3 §2, jediná výjimka). */}
        <Link href="/" className="font-logo text-xl font-semibold tracking-wide text-body">
          Tarot <span className="text-accent">o Lásce</span>
        </Link>

        <div className="flex items-center gap-3">
          <span
            className="hidden rounded-full border border-accent-dim px-2.5 py-1 text-[11px] uppercase tracking-wider text-accent-soft md:inline"
            title={`Výklady na tomto webu vykládá AI kartářka ${PERSONA_NAME}`}
          >
            Vykládá AI kartářka {PERSONA_NAME}
          </span>
          <CreditBadge />
          <nav className="hidden items-center gap-3 sm:flex">
            <Link href="/cenik" className="text-sm text-body-dim hover:text-body">Ceník</Link>
            <Link href="/historie" className="text-sm text-body-dim hover:text-body">Historie</Link>
          </nav>
          {!loading && (
            <Link href={accountHref} className="text-sm font-semibold text-accent-soft hover:text-accent">
              {accountLabel}
            </Link>
          )}
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Zavřít menu" : "Otevřít menu"}
            aria-expanded={open}
            className="rounded-lg border border-surface p-2 sm:hidden"
          >
            <span className="block h-0.5 w-4 bg-rose-500" />
            <span className="mt-1 block h-0.5 w-4 bg-rose-500" />
            <span className="mt-1 block h-0.5 w-4 bg-rose-500" />
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-surface bg-surface px-4 py-3 sm:hidden">
          <Link href="/cenik" onClick={() => setOpen(false)} className="block py-2 text-body">Ceník</Link>
          <Link href="/historie" onClick={() => setOpen(false)} className="block py-2 text-body">Historie</Link>
        </nav>
      )}
    </header>
  );
}
