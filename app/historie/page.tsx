"use client";
// Historie (v1.1 F.9): celá karta klikací; přístup jen přes session.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/useSession";

type Item = { id: string; question: string; spreadName: string; createdAt: number };

export default function HistoriePage() {
  const { email, loading } = useSession();
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    if (!email) return;
    fetch("/api/readings")
      .then((r) => r.json())
      .then((d) => setItems(d.readings ?? []));
  }, [email]);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="font-display text-body">Tvoje výklady</h1>

      {!loading && !email && (
        <p className="mt-6 text-body-dim">
          Historie patří k tvému účtu. {" "}
          <Link href="/prihlaseni" className="text-accent-soft underline underline-offset-2">
            Přihlas se kódem
          </Link>{" "}
          a najdeš tu všechny svoje výklady, i z jiných zařízení.
        </p>
      )}

      {email && items && items.length === 0 && (
        <div className="mt-8 rounded-2xl border border-surface bg-surface p-6">
          {/* NÁVRH copy (GPT bod 15 nebyl dodán) - schválí zakladatel */}
          <p className="text-body">Zatím tu nic není.</p>
          <p className="mt-1 text-body-dim">
            Až si necháš vyložit karty, každý výklad tu na tebe počká.
          </p>
          <Link
            href="/vyklad/novy"
            className="mt-4 inline-block rounded-xl bg-rose-500 px-5 py-2.5 text-plum-900 hover:opacity-90"
          >
            Položit první otázku
          </Link>
        </div>
      )}

      {email && items && items.length > 0 && (
        <ul className="mt-8 space-y-3">
          {items.map((it) => (
            <li key={it.id}>
              <Link
                href={`/vyklad/${it.id}`}
                className="block rounded-2xl border border-surface bg-surface p-5 transition hover:border-accent-dim"
              >
                <p className="text-xs uppercase tracking-wider text-body-dim">
                  {it.spreadName} ·{" "}
                  {new Date(it.createdAt).toLocaleDateString("cs-CZ")}
                </p>
                <p className="mt-1 font-medium text-body">
                  {it.question || "Bez otázky"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
