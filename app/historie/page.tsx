"use client";
// Historie (v1.6 §7.13): „Tvoje výklady". Celá karta klikací; přístup
// jen přes session. Karta: „[datum] · [X karet] · «[otázka]»".
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/useSession";

type Item = {
  id: string;
  question: string;
  cardCount: number;
  createdAt: number;
};

function karet(n: number): string {
  if (n === 1) return "1 karta";
  if (n >= 2 && n <= 4) return `${n} karty`;
  return `${n} karet`;
}

export default function HistoriePage() {
  const { email, loading } = useSession();
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    // Historie funguje i bez přihlášení (podepsaná cookie na zařízení),
    // takže načítáme vždy - přihlášení jen sjednotí s účtem.
    fetch("/api/readings")
      .then((r) => r.json())
      .then((d) => setItems(d.readings ?? []))
      .catch(() => setItems([]));
  }, [email]);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="font-display text-body">Tvoje výklady</h1>

      {/* Nepřihlášená bez výkladů (7.13 DOSLOVA): pobídka k přihlášení */}
      {!loading && !email && items && items.length === 0 && (
        <p className="mt-6 text-body-dim">
          Výklady máš zatím uložené na tomto zařízení. Přihlas se e-mailem,
          aby se ti uložily do účtu a mohla ses k nim kdykoliv vrátit.{" "}
          <Link href="/prihlaseni" className="text-accent-soft underline underline-offset-2">
            Přihlásit se
          </Link>
        </p>
      )}

      {/* Přihlášená bez výkladů (7.13 DOSLOVA) */}
      {email && items && items.length === 0 && (
        <div className="mt-8 rounded-2xl border border-surface bg-surface p-6">
          <p className="text-body">Zatím tu nemáš žádný výklad.</p>
          <p className="mt-1 text-body-dim">
            Polož otázku Nomi a výklad se ti uloží sem.
          </p>
          <Link href="/vyklad/novy" className="btn-primary mt-4">
            Položit otázku
          </Link>
        </div>
      )}

      {/* Nepřihlášená, ale na zařízení výklady jsou: nenásilná pobídka */}
      {!email && items && items.length > 0 && (
        <p className="mt-4 text-sm text-body-dim">
          Uložené na tomto zařízení.{" "}
          <Link href="/prihlaseni" className="text-accent-soft underline underline-offset-2">
            Přihlas se
          </Link>{" "}
          a budeš se k nim dostat i odjinud.
        </p>
      )}

      {items && items.length > 0 && (
        <ul className="mt-8 space-y-3">
          {items.map((it) => (
            <li key={it.id}>
              {/* Celá karta klikací (7.13) */}
              <Link
                href={`/vyklad/${it.id}`}
                className="block rounded-2xl border border-surface bg-surface p-5 transition hover:border-accent-dim"
              >
                <p className="text-xs uppercase tracking-wider text-body-dim">
                  {new Date(it.createdAt).toLocaleDateString("cs-CZ")} · {karet(it.cardCount)}
                </p>
                <p className="mt-1 font-medium text-body">
                  „{it.question || "Bez otázky"}"
                </p>
                <span className="mt-2 inline-block text-sm text-accent-soft">
                  Otevřít výklad
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
