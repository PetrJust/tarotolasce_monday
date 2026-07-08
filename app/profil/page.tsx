"use client";
// Profil: session z httpOnly cookie (v1.1 §B), kredit ze serverového
// ledgeru (§A). H.2: žádný spec jazyk v UI.
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/useSession";
import { useCreditsEnabled } from "@/lib/flags";
import { getReadingCount } from "@/lib/clientState";
import { vykladu } from "@/lib/declension";

export default function ProfilPage() {
  const { email, loading, logout } = useSession();
  const creditsEnabled = useCreditsEnabled();
  const [balance, setBalance] = useState(0);
  const [reads, setReads] = useState(0);

  useEffect(() => {
    setReads(getReadingCount());
    fetch("/api/credits").then((r) => r.json()).then((d) => setBalance(d.balance ?? 0)).catch(() => {});
  }, [email]);

  if (!loading && !email) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-body">Ještě nejsi přihlášená.</h1>
        <p className="mx-auto mt-3 max-w-sm text-body-dim">
          Stačí e-mail a šestimístný kód. Pokud u nás účet ještě nemáš,
          tímhle krokem ho rovnou založíme.
        </p>
        <Link
          href="/prihlaseni"
          className="mt-6 inline-block rounded-xl bg-rose-500 px-6 py-3 text-plum-900 hover:opacity-90"
        >
          Přihlásit se
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="font-display text-body">Profil</h1>

      <div className="mt-6 rounded-2xl border border-surface bg-surface p-6">
        <p className="text-xs uppercase tracking-wider text-body-dim">Přihlášena jako</p>
        <p className="mt-1 font-display text-xl font-semibold text-body">{email}</p>
      </div>

      <div className="mt-4 rounded-2xl border border-surface bg-surface p-6">
        <p className="text-xs uppercase tracking-wider text-body-dim">Výklady</p>
        <p className="mt-1 text-body">
          Na tomhle zařízení sis vyložila{" "}
          <strong className="lining-nums-price">{reads}</strong>{" "}
          {reads === 1 ? "výklad" : reads >= 2 && reads <= 4 ? "výklady" : "výkladů"}.{" "}
          <Link href="/historie" className="text-accent-soft underline underline-offset-2 hover:text-accent">
            Otevřít historii
          </Link>
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-surface bg-surface p-6">
        <p className="text-xs uppercase tracking-wider text-body-dim">Kredit a balíčky</p>
        {creditsEnabled ? (
          <p className="mt-1 text-body">
            {balance > 0 ? (
              <>Zbývá ti <strong className="lining-nums-price">{vykladu(balance)}</strong> z balíčku. </>
            ) : (
              <>Žádný kredit z balíčku. </>
            )}
            <Link href="/cenik" className="text-accent-soft underline underline-offset-2 hover:text-accent">
              Zobrazit balíčky
            </Link>
          </p>
        ) : (
          <p className="mt-1 text-body-dim">
            Balíčky spouštíme už brzy. Jednotlivé výklady fungují už teď.
          </p>
        )}
      </div>

      <button
        onClick={logout}
        className="mt-6 rounded-xl border border-surface px-5 py-2.5 text-sm text-body-dim hover:border-accent-dim hover:text-body"
      >
        Odhlásit se
      </button>
    </main>
  );
}
