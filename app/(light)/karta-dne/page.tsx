"use client";
import { tokens } from "@/lib/palette";
import { logEvent } from "@/lib/analytics";
// Karta dne (6.5): zdarma, 1x denně (mock: per browser přes cookie),
// rituál s výběrem 1 karty, krátký výklad, Sdílet na Stories (1080x1920),
// jemná nabídka „Chceš se zeptat na něco svého?"
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { PickedCard } from "@/components/Ritual";
import { CardBack } from "@/components/TarotCard";
import ReadingStream from "@/components/ReadingStream";
import OtpInput from "@/components/OtpInput";
import { PERSONA_NAME, PERSONA_FULL } from "@/lib/persona";
import { getCookie, setCookie } from "@/lib/clientState";

// v1.5 §5.2: BEZ rituálu - karta rubem nahoru hned po načtení,
// jeden dotek = otočeno. Rituální obrazovky patří jen placenému výkladu.
type Phase = "loading" | "ready" | "reading" | "done" | "already";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function KartaDnePage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [sessionId, setSessionId] = useState("");
  const [card, setCard] = useState<PickedCard | null>(null);
  const [text, setText] = useState("");
  const startedRef = useRef(false);

  const inviteLogged = useRef(false);
  useEffect(() => {
    // v1.6 §6/§11: proklik ranní pozvánky (metrika smyčky). Čteme přímo
    // z URL (ne useSearchParams - ta by tu vyžadovala Suspense boundary).
    if (
      !inviteLogged.current &&
      new URLSearchParams(window.location.search).get("from") === "invite"
    ) {
      inviteLogged.current = true;
      logEvent("daily_invite_click", {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const last = getCookie("tol_daily");
    if (last === todayKey()) {
      setPhase("already");
      return;
    }
    // Zamíchání proběhne samo při načtení (krátká animace na rubu níže)
    if (startedRef.current) return;
    startedRef.current = true;
    fetch("/api/session/shuffle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spread: "daily" }),
    })
      .then((r) => r.json())
      .then((res) => {
        setSessionId(res.sessionId);
        setPhase("ready");
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Jeden dotek = otočeno (v1.5 §5.2)
  const flippingRef = useRef(false);
  async function flip() {
    if (phase !== "ready" || flippingRef.current || !sessionId) return;
    flippingRef.current = true;
    try {
      const index = Math.floor(Math.random() * 78);
      const res = await fetch("/api/session/pick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, index }),
      });
      if (!res.ok) return;
      const picked: PickedCard = await res.json();
      navigator.vibrate?.(12);
      logEvent("daily_card_flip", { cardId: picked.cardId });
      setCard(picked);
      setCookie("tol_daily", todayKey(), 2);
      setPhase("reading");
    } finally {
      flippingRef.current = false;
    }
  }

  // Denní karta: double opt-in KÓDEM (v1.1 B.3). Po odeslání e-mailu se
  // zobrazí zadání šestimístného kódu; aktivace až po ověření na serveru.
  const [optinEmail, setOptinEmail] = useState("");
  const [optinStep, setOptinStep] = useState<"email" | "code" | "done">("email");
  const [optinCode, setOptinCode] = useState("");
  const [optinError, setOptinError] = useState<string | null>(null);
  const [optinBusy, setOptinBusy] = useState(false);
  const [optinDevCode, setOptinDevCode] = useState<string | null>(null);
  // v1.5 §5.2: přihlášené předvyplnit ověřenou adresu; aktivace 1 klepnutím
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d?.email) {
          setSessionEmail(d.email);
          setOptinEmail(d.email);
        }
      })
      .catch(() => {});
  }, []);
  async function activateForLoggedIn() {
    // Adresa už je ověřená přihlášením - aktivace bez dalšího kódu
    logEvent("daily_card_optin", { verified: "session" });
    setOptinStep("done");
  }
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
    // Stories export v2 (v1.5 §5.8): blush pozadí, nahoře dvoubarevný
    // wordmark, jméno karty, JEDNA věta vzkazu v uvozovkách (první věta,
    // truncate ~90 znaků na hranici věty), uprostřed tmavá karta se
    // zlatým rámem, dole DOSLOVA „Vytáhni si tu svoji na tarotolasce.cz".
    // PNG 1080x1920; SAFE ZÓNY: horních ~250 px a spodních ~310 px bez
    // klíčového obsahu. Obrácená karta: otočený název + „(obráceně)".
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const SAFE_TOP = 250;
    const SAFE_BOTTOM = 310; // obsah končí nad 1920-310 = 1610

    // Pozadí: blush (tokens v3), plochá
    ctx.fillStyle = tokens.blush;
    ctx.fillRect(0, 0, 1080, 1920);
    ctx.textAlign = "center";

    // Dvoubarevný wordmark (pod horní safe zónou)
    ctx.font = "600 66px Lora, Georgia, serif";
    const w1 = "Tarot ";
    const w2 = "o Lásce";
    const totalW = ctx.measureText(w1).width + ctx.measureText(w2).width;
    ctx.textAlign = "left";
    ctx.fillStyle = tokens.deepPlum;
    ctx.fillText(w1, 540 - totalW / 2, SAFE_TOP + 70);
    ctx.fillStyle = tokens.romanticPink;
    ctx.fillText(w2, 540 - totalW / 2 + ctx.measureText(w1).width, SAFE_TOP + 70);
    ctx.textAlign = "center";

    // Jméno karty (obrácená: popisek „(obráceně)")
    ctx.fillStyle = tokens.deepPlum;
    ctx.font = "600 58px Lora, Georgia, serif";
    ctx.fillText(card.reversed ? `${card.name} (obráceně)` : card.name, 540, SAFE_TOP + 170);

    // Jedna věta vzkazu v uvozovkách: první věta, truncate ~90 znaků
    // na hranici věty (když je první věta delší, zkrátí se s výpustkou).
    const firstSentence = (text.match(/[^.!?]*[.!?]/)?.[0] ?? text).trim();
    let quote = firstSentence;
    if (quote.length > 90) quote = quote.slice(0, 87).trimEnd() + "…";
    ctx.font = "38px Inter, Arial, sans-serif";
    ctx.fillStyle = "#5E486B"; // text-dim odvozenina
    // jednoduché zalomení na max 2 řádky
    const words = `„${quote}"`.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const t = line ? line + " " + w : w;
      if (ctx.measureText(t).width > 880 && line) {
        lines.push(line);
        line = w;
      } else line = t;
    }
    if (line) lines.push(line);
    lines.slice(0, 2).forEach((l, i) => ctx.fillText(l, 540, SAFE_TOP + 250 + i * 52));

    // Tmavá karta se zlatým rámem uprostřed
    const cw = 480;
    const ch = 780;
    const cx = (1080 - cw) / 2;
    const cy = 640;
    ctx.fillStyle = tokens.deepPlum;
    ctx.beginPath();
    ctx.roundRect(cx, cy, cw, ch, 32);
    ctx.fill();
    ctx.strokeStyle = tokens.softGold;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(cx + 22, cy + 22, cw - 44, ch - 44, 22);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(cx + 40, cy + 40, cw - 80, ch - 80, 14);
    ctx.stroke();

    ctx.save();
    if (card.reversed) {
      // otočený název/symbol uvnitř karty
      ctx.translate(540, cy + ch / 2);
      ctx.rotate(Math.PI);
      ctx.translate(-540, -(cy + ch / 2));
    }
    ctx.fillStyle = tokens.softGold;
    ctx.font = "200px Georgia, serif";
    ctx.fillText(card.symbol ?? "✦", 540, cy + ch / 2 + 30);
    ctx.fillStyle = tokens.blush;
    ctx.font = "600 46px Lora, Georgia, serif";
    ctx.fillText(card.name, 540, cy + ch - 90);
    ctx.restore();

    // Dole DOSLOVA (nad spodní safe zónou)
    ctx.fillStyle = tokens.deepPlum;
    ctx.font = "600 44px Inter, Arial, sans-serif";
    ctx.fillText("Vytáhni si tu svoji na tarotolasce.cz", 540, 1920 - SAFE_BOTTOM - 40);
    void SAFE_BOTTOM;

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

      {/* v1.5 §5.2: rovnou karta rubem nahoru, nad ní DOSLOVA
          „Klepni a otoč." Krátká zamíchací animace proběhne sama při
          načtení (CSS shake na rubu). Jeden dotek = otočeno. */}
      {(phase === "loading" || phase === "ready") && (
        <div className="mt-8 text-center">
          {/* v1.6 §6 DOSLOVA (před otočením) */}
          <p className="text-body-dim">
            Karta dne — Jedna karta a krátký vzkaz pro dnešní den.
          </p>
          <p className="mt-3 font-display text-2xl font-semibold text-body">
            Klepni a otoč.
          </p>
          <button
            onClick={flip}
            disabled={phase !== "ready"}
            aria-label="Otočit dnešní kartu"
            className="daily-shuffle mx-auto mt-6 block w-32 transition hover:scale-[1.03] disabled:cursor-wait"
          >
            <CardBack className="h-auto w-full drop-shadow-card" />
          </button>
        </div>
      )}

      {phase === "already" && (
        <div className="mt-6 rounded-2xl border border-surface bg-surface p-6">
          {/* v1.6 §6 DOSLOVA (už tažená) */}
          <p className="text-body">
            Dnešní kartu už máš. Další si můžeš vytáhnout zase zítra. A pokud
            se chceš zeptat na něco konkrétního, polož Nomi vlastní otázku.
          </p>
          <Link
            href="/vyklad/novy"
            className="mt-5 inline-block rounded-xl border border-accent-dim px-6 py-3 text-accent-soft hover:border-accent"
          >
            Položit vlastní otázku
          </Link>
        </div>
      )}

      {(phase === "reading" || phase === "done") && card && (
        <div className="mt-6">
          <div className="mx-auto max-w-40 text-center">
            {/* v1.6 §6 DOSLOVA (po otočení) */}
            <span className="text-xs text-accent-soft">Tvoje karta dne</span>
            <div className="mt-1 rounded-xl border border-surface bg-cream/95 p-4 text-plum-900">
              <span className="block text-4xl">{card.symbol ?? "✦"}</span>
              <span className="mt-1 block text-sm font-medium">
                {card.name}
                {card.reversed ? " (obráceně)" : ""}
              </span>
            </div>
          </div>

          <p className="mt-6 text-center text-xs uppercase tracking-wider text-body-dim">
            Vzkaz pro dnešek
          </p>
          <ReadingStream
            sessionId={sessionId}
            question=""
            spread="daily"
            cards={[card]}
            onDone={(full) => {
              setText(full);
              setPhase("done");
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
                <p className="text-sm text-body-dim">
                  Chceš se zeptat na něco konkrétního? Polož vlastní otázku a
                  Nomi ti vyloží karty.
                </p>
                <Link href="/vyklad/novy" className="btn-primary mt-3">
                  Položit vlastní otázku
                </Link>
              </div>

              {/* Opt-in na denní zasílání: nabízí se až PO otočení karty
                  (rozhodnutí zakladatele #3). Double opt-in KÓDEM (v1.1 B.3):
                  aktivace až po ověření šestimístného kódu z e-mailu. */}
              <div className="mx-auto mt-6 max-w-md rounded-2xl border border-surface bg-surface p-5 text-left">
                {optinStep === "done" ? (
                  <p className="text-sm text-body-dim">
                    Hotovo — každé ráno ti dáme vědět, že na tebe karta čeká.
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
                ) : sessionEmail ? (
                  <>
                    {/* v1.5 §5.2: přihlášená - adresa už ověřená, 1 klepnutí */}
                    <p className="font-medium text-body">
                      Chceš kartu dne dostávat každé ráno?
                    </p>
                    <p className="mt-1 text-sm text-body-dim">{sessionEmail}</p>
                    <button
                      onClick={activateForLoggedIn}
                      className="mt-3 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-plum-900 hover:opacity-90"
                    >
                      Chci
                    </button>
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
              zeptat na vlastní otázku a nechat si vyložit karty.
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
