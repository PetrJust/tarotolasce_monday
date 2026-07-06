"use client";
// Testovací panel: kredit a balíčky PŘES SERVER (v1.1 A). Tlačítka volají
// skutečné API: rychlé přihlášení přes OTP devCode (vyžaduje
// OTP_DEV_PREVIEW=1), nákup balíčku přes /api/checkout a zůstatek z
// /api/credits. Override viditelnosti balíčků (cookie) zůstává jen pro
// tvůj prohlížeč. Stránka je noindex + v produkci notFound (H.5).
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getDevCreditsOverride,
  setDevCreditsOverride,
  useCreditsEnabled,
  CREDITS_ENV_DEFAULT,
} from "@/lib/flags";
import {
  getSinglePurchases, bumpSinglePurchases,
  getFirstDone, setFirstDone, getReadingCount,
} from "@/lib/clientState";
import { PRICES, PRICE_IDS } from "@/lib/pricing";
import { announceSessionChange } from "@/lib/useSession";
import { APP_VERSION, APP_VERSION_DATE, APP_VERSION_NOTE } from "@/lib/version";

const PACKS = [
  { label: "5 výkladů", priceId: PRICE_IDS.pack5, price: PRICES.pack5 },
  { label: "20 výkladů", priceId: PRICE_IDS.pack20, price: PRICES.pack20 },
];

export default function DevKreditPage() {
  const creditsEnabled = useCreditsEnabled();
  const [override, setOverride] = useState<boolean | null>(null);
  const [singles, setSingles] = useState(0);
  const [firstDone, setFirstDoneState] = useState(false);
  const [reads, setReads] = useState(0);

  // serverový stav
  const [email, setEmail] = useState("test@tarotolasce.cz");
  const [loggedIn, setLoggedIn] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Diagnostika env proměnných - řeší "nastavil jsem to, ale nefunguje to"
  // bez dohadování nad Vercel dashboardem (v1.3 §5 hotfix).
  type EnvDiag = {
    vercelEnv: string | null;
    isProd: boolean;
    allowDevTools: boolean;
    otpDevPreview: boolean;
    hasTestOtpCode: boolean;
    devLoginAvailable: boolean;
    commitSha?: string | null;
  };
  const [envDiag, setEnvDiag] = useState<EnvDiag | null>(null);
  async function refreshEnvDiag() {
    try {
      const d = await fetch("/api/dev/env").then((r) => r.json());
      setEnvDiag(d);
    } catch {
      setEnvDiag(null);
    }
  }

  function refreshLocal() {
    setOverride(getDevCreditsOverride());
    setSingles(getSinglePurchases());
    setFirstDoneState(getFirstDone());
    setReads(getReadingCount());
  }
  async function refreshServer() {
    try {
      const c = await fetch("/api/credits").then((r) => r.json());
      setBalance(typeof c.balance === "number" ? c.balance : 0);
      setLoggedIn(!!c.loggedIn);
      const s = await fetch("/api/auth/session").then((r) => r.json()).catch(() => null);
      setSessionEmail(s?.email ?? null);
    } catch {
      setBalance(0);
      setLoggedIn(false);
    }
  }
  useEffect(() => {
    refreshLocal();
    void refreshServer();
    void refreshEnvDiag();
  }, []);

  // Rychlé přihlášení: request OTP -> devCode -> verify. Funguje jen s
  // OTP_DEV_PREVIEW=1 (mimo produkci); jinak odkáže na /prihlaseni.
  async function quickLogin() {
    setBusy(true);
    setMsg(null);
    try {
      const req = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }).then((r) => r.json());
      // devCode (OTP_DEV_PREVIEW) i testCode (TEST_OTP_CODE) jsou platný
      // kód pro tenhle e-mail - použij, co server poslal.
      const code = req?.devCode ?? req?.testCode;
      if (!code) {
        setMsg("Server nevrátil žádný kód (viz diagnostika prostředí výš). Přihlas se přes /prihlaseni.");
        return;
      }
      const ver = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      setMsg(ver.ok ? `Přihlášeno jako ${email}.` : "Ověření kódu selhalo.");
      if (ver.ok) announceSessionChange();
      await refreshServer();
    } finally {
      setBusy(false);
      void refreshEnvDiag();
    }
  }

  async function logout() {
    await fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
    setMsg("Odhlášeno.");
    announceSessionChange();
    await refreshServer();
  }

  async function buyPack(priceId: string, label: string) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      if (res.status === 401) {
        setMsg("Nákup balíčku vyžaduje přihlášení (kredit se váže na účet). Použij rychlé přihlášení výš.");
        return;
      }
      if (!res.ok) {
        setMsg(`Nákup selhal (${res.status}).`);
        return;
      }
      const data = await res.json();
      setMsg(`Balíček ${label} připsán. Zůstatek: ${data.balance}.`);
      await refreshServer();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="py-12">
      <h1 className="font-display text-[42px] leading-[1.1] font-semibold text-body">
        Testovací panel: kredit a balíčky
      </h1>
      {/* Označení verze buildu (lib/version.ts - zvedá se s každým předáním) */}
      <p className="mt-2 text-sm text-body-dim">
        Build <strong className="text-body">{APP_VERSION}</strong> · {APP_VERSION_DATE}
        {envDiag?.commitSha ? <> · commit <code className="text-xs">{envDiag.commitSha.slice(0, 7)}</code></> : null}
        <br />
        <span className="text-xs">{APP_VERSION_NOTE}</span>
      </p>
      <p className="mt-3 max-w-xl text-body-dim">
        Kredit tady běží proti skutečnému serverovému účtu (mock store):
        přihlásíš se, koupíš balíček přes API a zůstatek čteš stejně jako
        aplikace. Přepínač viditelnosti balíčků platí jen ve tvém prohlížeči.
      </p>

      {/* Diagnostika env proměnných - co server PRÁVĚ TEĎ vidí */}
      <div className="mt-6 rounded-2xl border border-accent-dim bg-surface p-6">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider text-body-dim">
            Diagnostika prostředí (co server právě vidí)
          </p>
          <button
            onClick={refreshEnvDiag}
            className="text-xs text-accent-soft underline underline-offset-2 hover:text-accent"
          >
            Obnovit
          </button>
        </div>
        {envDiag ? (
          <>
            <ul className="mt-2 space-y-1 text-sm text-body">
              <li>
                VERCEL_ENV: <strong>{envDiag.vercelEnv ?? "(nenastaveno - běžíš lokálně)"}</strong>
              </li>
              <li>
                ALLOW_DEV_TOOLS=1: <strong>{envDiag.allowDevTools ? "ano" : "ne"}</strong>
              </li>
              <li>
                OTP_DEV_PREVIEW=1: <strong>{envDiag.otpDevPreview ? "ano" : "ne"}</strong>
              </li>
              <li>
                TEST_OTP_CODE nastaven: <strong>{envDiag.hasTestOtpCode ? "ano" : "ne"}</strong>
              </li>
            </ul>
            <p className="mt-3 text-sm font-medium">
              {envDiag.devLoginAvailable ? (
                <span className="text-body">✓ Rychlé přihlášení by mělo fungovat.</span>
              ) : (
                <span className="text-accent-soft">
                  ✗ Rychlé přihlášení NEBUDE fungovat -{" "}
                  {!envDiag.otpDevPreview && !envDiag.hasTestOtpCode
                    ? "server nevidí ani OTP_DEV_PREVIEW=1, ani TEST_OTP_CODE (zkontroluj přesný název/hodnotu proměnných ve Vercelu a udělej Redeploy)."
                    : "podmínka isProd/allowDevTools není splněná (zkontroluj ALLOW_DEV_TOOLS=1 a udělej Redeploy)."}
                </span>
              )}
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-body-dim">Načítám…</p>
        )}
      </div>

      <div className="mt-8 rounded-2xl border border-surface bg-surface p-6">
        <p className="text-xs uppercase tracking-wider text-body-dim">Viditelnost balíčků</p>
        <p className="mt-1 text-body">
          Env výchozí: <strong>{CREDITS_ENV_DEFAULT ? "zapnuto" : "vypnuto"}</strong>
          {" · "}Tvůj override: <strong>{override === null ? "žádný" : override ? "zapnuto" : "vypnuto"}</strong>
          {" · "}Aktuálně platí: <strong>{creditsEnabled ? "ZAPNUTO" : "VYPNUTO"}</strong>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => { setDevCreditsOverride(true); refreshLocal(); }}
            className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-plum-900 hover:opacity-90"
          >
            Zapnout jen mně
          </button>
          <button
            onClick={() => { setDevCreditsOverride(false); refreshLocal(); }}
            className="rounded-xl border border-surface px-4 py-2 text-sm text-body hover:border-accent-dim"
          >
            Vypnout jen mně
          </button>
          <button
            onClick={() => { setDevCreditsOverride(null); refreshLocal(); }}
            className="rounded-xl border border-surface px-4 py-2 text-sm text-body-dim hover:border-accent-dim"
          >
            Smazat override (vrátit na výchozí)
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-surface bg-surface p-6">
        <p className="text-xs uppercase tracking-wider text-body-dim">Serverový účet</p>
        <p className="mt-1 text-body">
          Přihlášení: <strong>{loggedIn ? (sessionEmail ?? "ano") : "ne"}</strong>
          {" · "}Zůstatek: <strong className="tabular-nums-count">{balance}</strong>
        </p>

        <p className="mt-4 text-sm font-medium text-body">Rychlé přihlášení (OTP devCode)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-64 rounded-xl border border-surface bg-surface-2 p-2 text-sm text-body"
          />
          <button
            onClick={quickLogin}
            disabled={busy || !email.includes("@")}
            className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-plum-900 hover:opacity-90 disabled:opacity-40"
          >
            Přihlásit
          </button>
          <button
            onClick={logout}
            disabled={busy || !loggedIn}
            className="rounded-xl border border-surface px-4 py-2 text-sm text-body-dim hover:border-accent-dim disabled:opacity-40"
          >
            Odhlásit
          </button>
        </div>

        <p className="mt-4 text-sm font-medium text-body">Nákup balíčku přes /api/checkout</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PACKS.map((p) => (
            <button
              key={p.label}
              onClick={() => buyPack(p.priceId, p.label)}
              disabled={busy}
              className="rounded-xl border border-accent-dim px-4 py-2 text-sm text-accent-soft hover:border-accent disabled:opacity-40"
            >
              + {p.label} ({p.price} Kč)
            </button>
          ))}
          <button
            onClick={refreshServer}
            className="rounded-xl border border-surface px-4 py-2 text-sm text-body hover:border-accent-dim"
          >
            Obnovit zůstatek
          </button>
        </div>
        {msg && <p className="mt-3 text-sm text-accent-soft">{msg}</p>}
      </div>

      <div className="mt-4 rounded-2xl border border-surface bg-surface p-6">
        <p className="text-xs uppercase tracking-wider text-body-dim">Lokální stav (jen tenhle prohlížeč)</p>
        <p className="mt-1 text-body">
          Jednotlivé nákupy: <strong>{singles}</strong>
          {" · "}První výklad využit: <strong>{firstDone ? "ano" : "ne"}</strong>
          {" · "}Výklady celkem: <strong>{reads}</strong>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => { bumpSinglePurchases(); refreshLocal(); }}
            className="rounded-xl border border-surface px-4 py-2 text-sm text-body hover:border-accent-dim"
          >
            + jednotlivý nákup
          </button>
          <button
            onClick={() => { setFirstDone(); refreshLocal(); }}
            className="rounded-xl border border-surface px-4 py-2 text-sm text-body hover:border-accent-dim"
          >
            Označit „první výklad hotov"
          </button>
        </div>
      </div>

      <p className="mt-6 text-sm text-body-dim">
        Po přihlášení jdi normálně nakoupit na{" "}
        <Link href="/cenik" className="text-accent-soft underline underline-offset-2 hover:text-accent">
          ceník
        </Link>{" "}
        - tlačítko „Koupit balíček" volá stejné API jako tenhle panel a
        kredit se připíše ke stejnému účtu.
      </p>
    </div>
  );
}
