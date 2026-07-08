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
        {/* Oficiální wordmark (dodán zakladatelem: public/logo/
            wordmark-only.png). Nahrazuje textovou verzi v Loře. Výška
            fixní, šířka dopočítaná dle poměru (504×74). */}
        <Link href="/" className="flex items-center" aria-label="Tarot o Lásce — domů">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo/wordmark-only.png"
            alt="Tarot o Lásce"
            width={504}
            height={74}
            className="h-8 w-auto sm:h-9"
            draggable={false}
          />
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
            <Link href="/karta-dne" className="text-sm text-body-dim hover:text-body">Karta dne</Link>
            <Link href="/historie" className="text-sm text-body-dim hover:text-body">Historie</Link>
            <Link href="/cenik" className="text-sm text-body-dim hover:text-body">Ceník</Link>
            <Link href="/vyznam-karet" className="text-sm text-body-dim hover:text-body">Významy karet</Link>
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
      {/* v1.5 §5.7: pořadí položek DOSLOVA */}
      {open && (
        <nav className="border-t border-surface bg-surface px-4 py-3 sm:hidden">
          <Link href="/karta-dne" onClick={() => setOpen(false)} className="block py-2 text-body">Karta dne</Link>
          <Link href="/historie" onClick={() => setOpen(false)} className="block py-2 text-body">Historie</Link>
          <Link href="/cenik" onClick={() => setOpen(false)} className="block py-2 text-body">Ceník</Link>
          <Link href="/vyznam-karet" onClick={() => setOpen(false)} className="block py-2 text-body">Významy karet</Link>
        </nav>
      )}
    </header>
  );
}
