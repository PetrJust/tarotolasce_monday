"use client";
// Profil v2 (v1.5 §5.6). Pořadí sekcí dle zadání: (1) Jméno,
// (2) Moje karta dne, (3) Poslední výklad + historie, (4) Kredit,
// (5) Ranní pozvánka, (6) tichá řádka na SPIRIO.
// MOCK: jméno a preference ranní pozvánky žijí v cookie (tol_name,
// tol_daily_pref) - v produkci sloupce u účtu (PostgreSQL, schema.sql).
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/useSession";
import { getCookie, setCookie, getReadingCount } from "@/lib/clientState";
import { logEvent } from "@/lib/analytics";
import { SPIRIO_URL } from "@/lib/site";

type DailyPref = "daily" | "monday" | "off";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ProfilPage() {
  const { email, loading, logout } = useSession();
  const [balance, setBalance] = useState(0);
  const [reads, setReads] = useState(0);
  const [lastReading, setLastReading] = useState<{ id: string; question: string; createdAt: number } | null>(null);
  const [dailyDrawn, setDailyDrawn] = useState(false);

  // (1) Jméno - nepovinné, přeskočitelné, editovatelné (v1.5 §5.6);
  // veškeré copy funguje i bez jména (fallback bez oslovení).
  const [name, setName] = useState<string>("");
  const [nameDraft, setNameDraft] = useState("");
  const [askingName, setAskingName] = useState(false);
  const [editingName, setEditingName] = useState(false);

  // (5) Ranní pozvánka - každé ráno / jen v pondělí / vypnuto
  const [dailyPref, setDailyPref] = useState<DailyPref>("daily");

  useEffect(() => {
    setReads(getReadingCount());
    setDailyDrawn(getCookie("tol_daily") === todayKey());
    const savedName = getCookie("tol_name") ?? "";
    setName(savedName);
    const skipped = getCookie("tol_name_skip") === "1";
    setAskingName(!savedName && !skipped);
    const pref = getCookie("tol_daily_pref") as DailyPref | null;
    if (pref === "daily" || pref === "monday" || pref === "off") setDailyPref(pref);
    fetch("/api/credits")
      .then((r) => r.json())
      .then((d) => setBalance(d.balance ?? 0))
      .catch(() => {});
    fetch("/api/readings")
      .then((r) => r.json())
      .then((d) => {
        // API vrací { readings } (cookie + server, sjednocené s historií)
        const items = Array.isArray(d?.readings) ? d.readings : [];
        setReads(items.length);
        if (items.length) setLastReading(items[0]);
      })
      .catch(() => {});
  }, [email]);

  function saveName(value: string) {
    const trimmed = value.trim().slice(0, 40);
    setName(trimmed);
    setCookie("tol_name", trimmed);
    setAskingName(false);
    setEditingName(false);
  }
  function skipName() {
    setCookie("tol_name_skip", "1");
    setAskingName(false);
  }
  function savePref(p: DailyPref) {
    setDailyPref(p);
    setCookie("tol_daily_pref", p);
  }

  const plural = (n: number, one: string, few: string, many: string) =>
    n === 1 ? one : n >= 2 && n <= 4 ? few : many;

  if (!loading && !email) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-body">Ještě nejsi přihlášená.</h1>
        <p className="mx-auto mt-3 max-w-sm text-body-dim">
          Stačí e-mail a šestimístný kód. Pokud u nás účet ještě nemáš,
          tímhle krokem ho rovnou založíme.
        </p>
        <Link href="/prihlaseni" className="btn-primary mt-6">
          Přihlásit se
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="font-display text-body">Profil</h1>

      {/* (1) Jméno: zobrazené místo e-mailu, e-mail menším řádkem pod */}
      <div className="mt-6 rounded-2xl border border-surface bg-surface p-6">
        {askingName ? (
          <>
            {/* Nepovinná otázka po prvním přihlášení DOSLOVA */}
            <p className="font-medium text-body">Jak ti mám říkat?</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                type="text"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="tvoje jméno (nepovinné)"
                className="w-56 rounded-xl border border-surface bg-surface-2 p-2.5 text-sm text-body"
              />
              <button
                onClick={() => saveName(nameDraft)}
                disabled={!nameDraft.trim()}
                className="rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-plum-900 hover:opacity-90 disabled:opacity-50"
              >
                Uložit
              </button>
              <button
                onClick={skipName}
                className="rounded-xl border border-surface px-4 py-2.5 text-sm text-body-dim hover:border-accent-dim"
              >
                Přeskočit
              </button>
            </div>
          </>
        ) : editingName ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              className="w-56 rounded-xl border border-surface bg-surface-2 p-2.5 text-sm text-body"
            />
            <button
              onClick={() => saveName(nameDraft)}
              className="rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-plum-900 hover:opacity-90"
            >
              Uložit
            </button>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div>
              {/* 7.14 (2) DOSLOVA */}
              <p className="text-xs uppercase tracking-wider text-body-dim">
                Přihlášená jako
              </p>
              <p className="mt-1 font-display text-xl font-semibold text-body">
                {name || email}
              </p>
              {name && <p className="mt-0.5 text-sm text-body-dim">{email}</p>}
            </div>
            <button
              onClick={() => { setNameDraft(name); setEditingName(true); }}
              className="text-sm text-accent-soft underline underline-offset-2 hover:text-accent"
            >
              {name ? "Upravit jméno" : "Přidat jméno"}
            </button>
          </div>
        )}
      </div>

      {/* (2) Moje karta dne */}
      <div className="mt-4 rounded-2xl border border-surface bg-surface p-6">
        <p className="text-xs uppercase tracking-wider text-body-dim">Moje karta dne</p>
        <p className="mt-1 text-body">
          {dailyDrawn ? "Dnešní kartu už máš otočenou." : "Dnešní karta na tebe ještě čeká."}{" "}
          <Link href="/karta-dne" className="text-accent-soft underline underline-offset-2 hover:text-accent">
            {dailyDrawn ? "Podívat se znovu" : "Otočit kartu"}
          </Link>
        </p>
      </div>

      {/* (3) Poslední výklad + historie; copy fix DOSLOVA (bez „zařízení") */}
      <div className="mt-4 rounded-2xl border border-surface bg-surface p-6">
        <p className="text-xs uppercase tracking-wider text-body-dim">Tvoje výklady</p>
        {lastReading && (
          <p className="mt-1 text-body">
            Poslední výklad:{" "}
            <Link
              href={`/vyklad/${lastReading.id}`}
              className="text-accent-soft underline underline-offset-2 hover:text-accent"
            >
              „{lastReading.question || "Bez otázky"}"
            </Link>
          </p>
        )}
        <p className="mt-1 text-body">
          {reads > 0 ? (
            <>
              Máš {plural(reads, "uložený", "uložené", "uložených")}{" "}
              <strong className="lining-nums-price">{reads}</strong>{" "}
              {plural(reads, "výklad", "výklady", "výkladů")}.
            </>
          ) : (
            <>Zatím tu nemáš žádný výklad.</>
          )}{" "}
          <Link href="/historie" className="text-accent-soft underline underline-offset-2 hover:text-accent">
            Otevřít historii
          </Link>
        </p>
      </div>

      {/* (4) Zbývající výklady - hodnota vždy ze SUM ledgeru */}
      <div className="mt-4 rounded-2xl border border-surface bg-surface p-6">
        <p className="text-xs uppercase tracking-wider text-body-dim">Zbývající výklady</p>
        <p className="mt-1 text-body">
          {balance > 0 ? (
            <>Z balíčku ti zbývá <strong className="lining-nums-price">{balance}</strong> {plural(balance, "výklad", "výklady", "výkladů")}.</>
          ) : (
            <>
              Nemáš žádný aktivní balíček.{" "}
              <Link href="/cenik" className="text-accent-soft underline underline-offset-2 hover:text-accent">
                Zobrazit balíčky
              </Link>
            </>
          )}
        </p>
      </div>

      {/* (5) Ranní pozvánka - přepínač */}
      <div className="mt-4 rounded-2xl border border-surface bg-surface p-6">
        <p className="text-xs uppercase tracking-wider text-body-dim">Ranní připomenutí karty dne</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {([
            ["daily", "Každé ráno"],
            ["monday", "Jen v pondělí"],
            ["off", "Vypnuto"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => savePref(value)}
              aria-pressed={dailyPref === value}
              className={`rounded-xl border px-4 py-2 text-sm ${
                dailyPref === value
                  ? "border-accent text-body"
                  : "border-surface text-body-dim hover:border-accent-dim"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* (6) Tichá řádka DOSLOVA, sekundární styl, mimo timing pravidlo mostu */}
      <p className="mt-6 text-sm text-body-dim">
        <a
          href={`${SPIRIO_URL}?utm_source=tarotolasce&utm_medium=app&utm_campaign=profil`}
          target="_blank"
          rel="noopener"
          onClick={() => logEvent("spirio_click", { source: "profil", reads })}
          className="underline underline-offset-2 hover:text-body"
        >
          Chceš se spojit se skutečnou kartářkou? → Spirio
        </a>
      </p>

      <button
        onClick={logout}
        className="mt-6 rounded-xl border border-surface px-5 py-2.5 text-sm text-body-dim hover:border-accent-dim hover:text-body"
      >
        Odhlásit se
      </button>
    </main>
  );
}
