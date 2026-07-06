"use client";
// Přihlášení e-mailovým OTP kódem (v1.1 §B.1 - copy od UX architektky,
// implementováno přesně). Dvě obrazovky: e-mail -> kód. Klientka nikdy
// neopouští aplikaci; kód je i v předmětu e-mailu.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import OtpInput from "@/components/OtpInput";
import { announceSessionChange } from "@/lib/useSession";
import { emailSuggestion } from "@/lib/emailSuggest";
import { PERSONA_NAME } from "@/lib/persona";

type Screen = "email" | "code";

export default function PrihlaseniPage() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [expired, setExpired] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);
  // v1.3 §5: TEST_OTP_CODE banner (server ho vrací jen mimo produkci)
  const [testCode, setTestCode] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const suggestion = emailSuggestion(email);

  function startCountdown() {
    setResendIn(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendIn((s) => {
        if (s <= 1 && timerRef.current) clearInterval(timerRef.current);
        return Math.max(0, s - 1);
      });
    }, 1000);
  }
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  async function requestCode(isResend: boolean) {
    setSending(true);
    setError(null);
    setExpired(false);
    const res = await fetch("/api/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, purpose: "login" }),
    }).then((r) => r.json()).catch(() => ({ ok: true }));
    setDevCode(res.devCode ?? null);
    setTestCode(res.testCode ?? null);
    setSending(false);
    setScreen("code");
    setCode("");
    startCountdown();
    if (isResend) setInfo("Nový kód je na cestě. Platí vždycky ten poslední.");
    else setInfo(null);
  }

  async function verify(full: string) {
    setVerifying(true);
    setError(null);
    const res = await fetch("/api/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: full, purpose: "login" }),
    });
    const data = await res.json().catch(() => ({ ok: false, error: "invalid" }));
    setVerifying(false);
    if (data.ok) {
      announceSessionChange(); // fix v1.3 §6.1: nav hned ví o přihlášení
      router.push("/profil");
      return;
    }
    setCode("");
    if (data.error === "locked") {
      setLocked(true);
      return;
    }
    if (data.error === "expired") {
      setExpired(true);
      return;
    }
    setError("Kód nesedí. Zkontroluj poslední e-mail a zkus to znovu.");
    if (typeof data.attemptsLeft === "number" && data.attemptsLeft <= 2) {
      setAttemptsLeft(data.attemptsLeft);
    }
  }

  const mmss = `0:${String(resendIn).padStart(2, "0")}`;

  return (
    <main className="mx-auto w-full max-w-md px-4 py-16">
      {screen === "email" && (
        <>
          <h1 className="font-display text-body">Přihlášení</h1>
          <p className="mt-3 text-body-dim">
            Napiš mi svůj e-mail. Pošlu ti šestimístný kód, opíšeš ho sem a
            jsi doma. Žádné heslo.
          </p>
          <div className="mt-8">
            <label htmlFor="email" className="block text-sm text-body">
              Tvůj e-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-surface bg-surface p-3 text-body focus:border-accent"
            />
            {suggestion && (
              <button
                type="button"
                onClick={() => setEmail(suggestion)}
                className="mt-2 text-sm text-accent-soft underline underline-offset-2"
              >
                Myslela jsi {suggestion}?
              </button>
            )}
            <button
              onClick={() => requestCode(false)}
              disabled={!email.includes("@") || sending}
              className="btn-primary mt-4 w-full"
            >
              {sending ? "Posílám…" : "Poslat kód"}
            </button>
            <p className="mt-3 text-xs text-body-dim">
              Pokud u nás účet ještě nemáš, tímhle krokem ho rovnou založíme.
            </p>
          </div>
        </>
      )}

      {screen === "code" && (
        <>
          {/* v1.3 §3.9: nadpis obrazovky kódu DOSLOVA */}
          <h1 className="font-display text-body">Zadej kód z e-mailu</h1>
          {testCode && (
            <p className="mt-3 rounded-xl border border-accent-dim bg-surface p-3 text-sm text-body">
              Testovací režim: kód je{" "}
              <strong className="tabular-nums-count">{testCode}</strong>
            </p>
          )}
          <p className="mt-3 text-body-dim">
            Poslala jsem ti kód na {email} ·{" "}
            <button
              onClick={() => { setScreen("email"); setLocked(false); setError(null); }}
              className="text-accent-soft underline underline-offset-2"
            >
              upravit adresu
            </button>
          </p>

          {locked ? (
            <div className="mt-8 rounded-2xl border border-surface bg-surface p-6">
              <p className="text-body">
                Pro jistotu jsem přihlášení na čtvrt hodiny zamkla. Zkus to
                pak znovu, nebo nám napiš na ahoj@tarotolasce.cz.
              </p>
            </div>
          ) : expired ? (
            <div className="mt-8 rounded-2xl border border-surface bg-surface p-6">
              <p className="text-body">Kód už vypršel, platí deset minut. Pošlu ti nový?</p>
              <button
                onClick={() => requestCode(true)}
                className="mt-4 w-full rounded-xl bg-rose-500 px-6 py-3 text-plum-900 hover:opacity-90"
              >
                Poslat nový kód
              </button>
            </div>
          ) : (
            <div className="mt-8">
              <OtpInput
                value={code}
                onChange={setCode}
                onComplete={verify}
                disabled={verifying}
              />
              {error && (
                <p className="mt-3 text-sm text-accent-soft">
                  {error}
                  {attemptsLeft !== null && (
                    <>
                      {" "}
                      Zbývají {attemptsLeft} {attemptsLeft === 1 ? "pokus" : "pokusy"}.
                    </>
                  )}
                </p>
              )}
              {info && <p className="mt-3 text-sm text-body-dim">{info}</p>}
              {devCode && (
                <p className="mt-3 rounded-lg border border-surface bg-surface p-2 text-xs text-body-dim">
                  Dev náhled kódu (jen mimo produkci): <strong className="tabular-nums-count">{devCode}</strong>
                </p>
              )}
              <button
                onClick={() => requestCode(true)}
                disabled={resendIn > 0 || sending}
                className="mt-6 w-full rounded-xl border border-surface px-6 py-3 text-body-dim hover:border-accent-dim disabled:opacity-60"
              >
                {resendIn > 0 ? (
                  <span className="tabular-nums-count">Poslat znovu · {mmss}</span>
                ) : (
                  "Poslat znovu"
                )}
              </button>
            </div>
          )}
          <p className="mt-6 text-xs text-body-dim">
            Kód najdeš i v předmětu e-mailu od {PERSONA_NAME} z Tarotu o Lásce.
          </p>
        </>
      )}
    </main>
  );
}
