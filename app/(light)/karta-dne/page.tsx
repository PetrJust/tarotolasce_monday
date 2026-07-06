"use client";
import { palette, tokens, NIGHT_FLAT } from "@/lib/palette";
import { logEvent } from "@/lib/analytics";
// Karta dne (6.5): zdarma, 1x denně (mock: per browser přes cookie),
// rituál s výběrem 1 karty, krátký výklad, Sdílet na Stories (1080x1920),
// jemná nabídka „Chceš se zeptat na něco svého?"
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Ritual, { PickedCard } from "@/components/Ritual";
import ReadingStream from "@/components/ReadingStream";
import OtpInput from "@/components/OtpInput";
import { PERSONA_NAME, PERSONA_FULL } from "@/lib/persona";
import { getCookie, setCookie } from "@/lib/clientState";

type Phase = "intro" | "ritual" | "reading" | "done" | "already";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function KartaDnePage() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [sessionId, setSessionId] = useState("");
  const [card, setCard] = useState<PickedCard | null>(null);
  const [text, setText] = useState("");
  const startedRef = useRef(false);

  useEffect(() => {
    const last = getCookie("tol_daily");
    if (last === todayKey()) setPhase("already");
  }, []);

  async function start() {
    if (startedRef.current) return;
    startedRef.current = true;
    const res = await fetch("/api/session/shuffle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spread: "daily" }),
    }).then((r) => r.json());
    setSessionId(res.sessionId);
    setPhase("ritual");
  }

  function onComplete(cards: PickedCard[]) {
    setCard(cards[0]);
    setCookie("tol_daily", todayKey(), 2);
    setPhase("reading");
  }

  // Denní karta: double opt-in KÓDEM (v1.1 B.3). Po odeslání e-mailu se
  // zobrazí zadání šestimístného kódu; aktivace až po ověření na serveru.
  const [optinEmail, setOptinEmail] = useState("");
  const [optinStep, setOptinStep] = useState<"email" | "code" | "done">("email");
  const [optinCode, setOptinCode] = useState("");
  const [optinError, setOptinError] = useState<string | null>(null);
  const [optinBusy, setOptinBusy] = useState(false);
  const [optinDevCode, setOptinDevCode] = useState<string | null>(null);
  async function submitOptin() {
    // MOCK: v produkci pošle skutečný e-mail (kód v předmětu)
    const res = await fetch("/api/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: optinEmail, purpose: "daily_card_optin" }),
    }).then((r) => r.json()).catch(() => ({}));
    setOptinDevCode(res?.devCode ?? null);
    logEvent("daily_card_optin", {});
    setOptinError(null);
    setOptinCode("");
    setOptinStep("code");
  }
  async function verifyOptin(code: string) {
    setOptinBusy(true);
    setOptinError(null);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: optinEmail, code, purpose: "daily_card_optin" }),
      });
      if (res.ok) {
        setOptinStep("done");
      } else {
        setOptinCode("");
        setOptinError("Kód nesedí. Zkontroluj poslední e-mail a zkus to znovu.");
      }
    } finally {
      setOptinBusy(false);
    }
  }

  // Sdílet na Stories: obrázek 1080x1920 s kartou, logem a doménou
  function shareToStories() {
    if (!card) return;
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // v1.3 §1: žádný gradient, plochá noční fialová
    ctx.fillStyle = NIGHT_FLAT;
    ctx.fillRect(0, 0, 1080, 1920);

    // Logo
    ctx.fillStyle = palette.cream.DEFAULT;
    ctx.font = "600 64px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("Tarot o Lásce", 540, 220);
    ctx.fillStyle = tokens.gold600;
    ctx.font = "44px Georgia, serif";
    ctx.fillText("Karta dne", 540, 300);

    // Karta (zjednodušený líc)
    const cw = 520;
    const ch = 860;
    const cx = (1080 - cw) / 2;
    const cy = 420;
    ctx.fillStyle = palette.cream.DEFAULT;
    ctx.beginPath();
    ctx.roundRect(cx, cy, cw, ch, 36);
    ctx.fill();
    ctx.strokeStyle = palette.night.DEFAULT;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.roundRect(cx + 24, cy + 24, cw - 48, ch - 48, 24);
    ctx.stroke();
    ctx.strokeStyle = tokens.gold600;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(cx + 44, cy + 44, cw - 88, ch - 88, 16);
    ctx.stroke();

    ctx.save();
    if (card.reversed) {
      ctx.translate(540, cy + ch / 2);
      ctx.rotate(Math.PI);
      ctx.translate(-540, -(cy + ch / 2));
    }
    ctx.fillStyle = palette.night.soft;
    ctx.font = "220px Georgia, serif";
    ctx.fillText(card.symbol ?? "✦", 540, cy + ch / 2 + 40);
    ctx.fillStyle = palette.night.DEFAULT;
    ctx.font = "600 52px Georgia, serif";
    ctx.fillText(card.name, 540, cy + ch - 110);
    ctx.restore();

    ctx.fillStyle = palette.cream.dim;
    ctx.font = "40px Georgia, serif";
    ctx.fillText(card.reversed ? `${card.name} (obráceně)` : card.name, 540, cy + ch + 110);

    // Doména
    ctx.fillStyle = tokens.gold600;
    ctx.font = "600 48px Georgia, serif";
    ctx.fillText("tarotolasce.cz", 540, 1800);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `karta-dne-${todayKey()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  return (
    <div className="py-10">
      <h1 className="font-display text-[42px] leading-[1.1] font-semibold text-body">
        Karta dne
      </h1>
      <p className="mt-2 text-sm text-body-dim">Vybírá a vykládá {PERSONA_FULL}</p>

      {phase === "intro" && (
        <div className="mt-6">
          <p className="max-w-xl text-body-dim">
            Jedna karta a krátký vzkaz pro tvůj den. Zdarma, každý den jedna.
            Nadechni se a vytáhni si tu svoji.
          </p>
          <button
            onClick={start}
            className="btn-primary mt-8"
          >
            Vytáhnout dnešní kartu
          </button>
        </div>
      )}

      {phase === "already" && (
        <div className="mt-6 rounded-2xl border border-surface bg-surface p-6">
          <p className="text-body">Dnešní kartu už sis vytáhla.</p>
          <p className="mt-2 text-sm text-body-dim">
            Nová na tebe čeká zítra ráno. Jestli tě mezitím něco pálí, můžeš se
            zeptat na vlastní otázku.
          </p>
          <Link
            href="/vyklad/novy"
            className="mt-5 inline-block rounded-xl border border-accent-dim px-6 py-3 text-accent-soft hover:border-accent"
          >
            Chceš se zeptat na něco svého?
          </Link>
        </div>
      )}

      {phase === "ritual" && (
        <Ritual
          sessionId={sessionId}
          cardCount={1}
          positions={["Dnešní karta"]}
          onReshuffle={async () => {
            const res = await fetch("/api/session/shuffle", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ spread: "daily" }),
            }).then((r) => r.json());
            setSessionId(res.sessionId);
            return res.sessionId as string;
          }}
          onComplete={onComplete}
        />
      )}

      {(phase === "reading" || phase === "done") && card && (
        <div className="mt-6">
          <div className="mx-auto max-w-40 text-center">
            <span className="text-xs text-accent-soft">Dnešní karta</span>
            <div className="mt-1 rounded-xl border border-surface bg-cream/95 p-4 text-plum-900">
              <span className="block text-4xl">{card.symbol ?? "✦"}</span>
              <span className="mt-1 block text-sm font-medium">
                {card.name}
                {card.reversed ? " (obráceně)" : ""}
              </span>
            </div>
          </div>

          <ReadingStream
            sessionId={sessionId}
            question=""
            spread="daily"
            cards={[card]}
            onDone={(full) => {
              setText(full);
              setPhase("done");
              logEvent("daily_card_flip", { cardId: card?.cardId });
            }}
          />

          {phase === "done" && (
            <div className="mt-8 space-y-4 text-center">
              <button
                onClick={shareToStories}
                className="rounded-xl bg-rose-500 px-6 py-3 font-medium text-plum-900 hover:opacity-90"
              >
                Sdílet na Stories
              </button>
              <div>
                <Link
                  href="/vyklad/novy"
                  className="text-accent-soft underline underline-offset-4 hover:text-accent"
                >
                  Chceš se zeptat na něco svého?
                </Link>
              </div>

              {/* Opt-in na denní zasílání: nabízí se až PO otočení karty
                  (rozhodnutí zakladatele #3). Double opt-in KÓDEM (v1.1 B.3):
                  aktivace až po ověření šestimístného kódu z e-mailu. */}
              <div className="mx-auto mt-6 max-w-md rounded-2xl border border-surface bg-surface p-5 text-left">
                {optinStep === "done" ? (
                  <p className="text-sm text-body-dim">
                    Hotovo, karta dne ti od zítřka začne chodit každé ráno.
                    V každém e-mailu najdeš odhlášení.
                  </p>
                ) : optinStep === "code" ? (
                  <>
                    <p className="font-medium text-body">
                      Poslali jsme ti šestimístný kód na {optinEmail}.
                    </p>
                    <p className="mt-1 text-sm text-body-dim">
                      Najdeš ho v předmětu e-mailu. Zadej ho sem a karta dne
                      se aktivuje.
                    </p>
                    <div className="mt-4">
                      <OtpInput
                        value={optinCode}
                        onChange={setOptinCode}
                        onComplete={verifyOptin}
                        disabled={optinBusy}
                      />
                    </div>
                    {optinError && (
                      <p className="mt-3 text-sm text-accent-soft">{optinError}</p>
                    )}
                    {optinDevCode && (
                      <p className="mt-3 text-xs text-body-dim">
                        Dev náhled kódu (jen mimo produkci):{" "}
                        <strong className="tabular-nums-count">{optinDevCode}</strong>
                      </p>
                    )}
                    <div className="mt-3 flex gap-4 text-xs text-body-dim">
                      <button onClick={submitOptin} className="underline underline-offset-2 hover:text-body">
                        Poslat kód znovu
                      </button>
                      <button
                        onClick={() => { setOptinStep("email"); setOptinCode(""); setOptinError(null); }}
                        className="underline underline-offset-2 hover:text-body"
                      >
                        Upravit adresu
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-body">
                      Chceš kartu dne dostávat každé ráno?
                    </p>
                    <div className="mt-3 flex gap-2">
                      <input
                        type="email"
                        value={optinEmail}
                        onChange={(e) => setOptinEmail(e.target.value)}
                        placeholder="tvůj e-mail"
                        className="w-full rounded-xl border border-surface bg-surface-2 p-2.5 text-sm text-body"
                      />
                      <button
                        onClick={submitOptin}
                        disabled={!optinEmail.includes("@")}
                        className="shrink-0 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-plum-900 disabled:opacity-60 disabled:saturate-[.35]"
                      >
                        Chci
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* SEO text (v1 §10: ~300 slov indexovatelného obsahu) */}
          <section className="mx-auto mt-14 max-w-xl space-y-4 text-left text-sm leading-relaxed text-body-dim">
            <h2 className="font-display text-[30px] leading-[1.15] font-semibold text-body">
              Co je karta dne a jak s ní pracovat
            </h2>
            <p>
              Karta dne je malý denní rituál: jedna tarotová karta, kterou si
              otočíš ráno nebo kdykoli během dne, a krátký vzkaz od naší AI
              kartářky. Nejde o předpověď budoucnosti. Karta dne funguje
              jako zrcadlo, které ti pomůže na chvíli se zastavit, pojmenovat,
              co právě prožíváš, a všimnout si věcí, které v běhu dne snadno
              přehlédneš.
            </p>
            <p>
              Jak s kartou pracovat? Nejlépe krátce a pravidelně. Otoč si
              kartu, přečti si vzkaz a polož si jednoduchou otázku: kde se mě
              tohle dnes může týkat? Někdy karta trefí přesně to, co řešíš,
              jindy se zdánlivě mine. I to je v pořádku. Smyslem není, aby
              karta „uhodla" tvůj den, ale aby ti dala podnět k zamyšlení,
              které by tě jinak nenapadlo.
            </p>
            <p>
              Karta dne je u nás zdarma a bez registrace. Vybírá ji náhodný
              tah ze všech 78 karet tarotu, včetně obrácených pozic, a AI kartářka k
              ní napíše krátký výklad zaměřený na lásku, vztahy a to, co se
              děje v tobě. Pokud tě karta zaujme a chceš jít hloub, můžeš se
              zeptat na vlastní otázku a nechat si vyložit celý rozklad.
            </p>
            <p>
              Tip na závěr: nezapisuj si jen karty, ale hlavně to, co v tobě
              vyvolaly. Po pár týdnech se ohlédni. Vzorce, které v zápiscích
              uvidíš, ti o tvém srdci řeknou víc než jakákoli jednotlivá
              karta.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
