"use client";
// FLOW B (v1.6 §5 - NEJVYŠŠÍ PRIORITA): otázka → „Na chvíli se zastav"
// → míchání → vějíř → výběr karet → ÚVOD ZDARMA (teaser) → fólie
// s platebním schodištěm → platba → zbytek výkladu NAVÁŽE přesně tam,
// kde úvod skončil → Co dál. Staré flow (platba před rituálem) zůstává
// za flagem FLOW_CLASSIC (default off).
// Aplikační stránka, noindex (viz layout v této složce).
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import CrisisScreen from "@/components/CrisisScreen";
import Ritual, { PickedCard } from "@/components/Ritual";
import ReadingStream from "@/components/ReadingStream";
import { CardBack } from "@/components/TarotCard";
import ThreePaths from "@/components/ThreePaths";
import ReadingFeedback from "@/components/ReadingFeedback";
import GooglePayButton from "@/components/GooglePayButton";
import { SPREADS, SpreadKey, betweenUsPositions } from "@/lib/spreads";
import { PRICES, PRICE_IDS } from "@/lib/pricing";
import { moderate } from "@/lib/moderation";
import { classify, categorize } from "@/lib/classifier";
import { useCreditsEnabled, SHOW_1837_CONSENT, FLOW_CLASSIC } from "@/lib/flags";
import { logEvent, readingType } from "@/lib/analytics";
import { QUESTION_CHIPS } from "@/lib/chips";
import { SPIRIO_URL } from "@/lib/site";
import { vykladu, kartyAkuzativ } from "@/lib/declension";
import {
  getSinglePurchases, bumpSinglePurchases,
  getFirstDone, setFirstDone, getEmail, setEmail as persistEmail,
  bumpReadingCount,
} from "@/lib/clientState";

type Step =
  | "question"
  | "crisis_a" | "crisis_b" | "crisis_c"
  | "ritual"
  | "loadingTeaser"
  | "teaser"        // úvod se streamuje zdarma
  | "folie"         // fólie + platební schodiště
  | "paying"
  | "payment_failed"
  | "reading"       // pokračování po odemčení (nebo celý při kreditu)
  | "reading_error"
  | "paths";

// Platební schod (5.3): a) první nákup · b) vracející se · c) 3. nákup
// v měsíci (tichá řádka navíc) · d) kredit (fólie se nezobrazuje)
type Stair = "a" | "b" | "c" | "d";

function FlowInner() {
  const creditsEnabled = useCreditsEnabled();
  const params = useSearchParams();
  const [step, setStep] = useState<Step>("question");
  const [question, setQuestion] = useState(params.get("q") ?? "");
  const [spread, setSpread] = useState<Exclude<SpreadKey, "daily">>("between_us");
  const [email, setEmail] = useState("");
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [consent, setConsent] = useState(!SHOW_1837_CONSENT);
  const [sessionId, setSessionId] = useState("");
  const [cards, setCards] = useState<PickedCard[]>([]);
  const [readingId, setReadingId] = useState("");
  const [credits, setCreditsState] = useState(0);
  const [singles, setSingles] = useState(0);
  const [isFirst, setIsFirst] = useState(true);
  const [creditUsed, setCreditUsed] = useState(false);
  // Flow B stav
  const [teaser, setTeaser] = useState(""); // plný text úvodu ze serveru
  const [teaserShown, setTeaserShown] = useState(""); // postupné odhalování
  const [limitedMsg, setLimitedMsg] = useState<string | null>(null);
  const [crisisText, setCrisisText] = useState<string | null>(null);
  const [introUsedServer, setIntroUsedServer] = useState(false); // schod f)
  const [processing, setProcessing] = useState(!!params.get("q")?.trim());
  const autoStarted = useRef(false);
  const countedRef = useRef(false);
  const teaserEventSent = useRef(false);
  const [isApplePlatform, setIsApplePlatform] = useState(false);
  useEffect(() => {
    setIsApplePlatform(/Mac|iPhone|iPad|iPod/.test(navigator.userAgent));
  }, []);

  // Aktuální schod ceníku (5.3) - pro copy i eventy
  const stair: Stair = creditUsed || (creditsEnabled && credits > 0)
    ? "d"
    : (!isFirst || introUsedServer)
    ? singles >= 2 ? "c" : "b"
    : "a";

  const payDisabled = !consent || step === "paying" ||
    (stair === "a" && !email.includes("@"));

  // Našeptávač e-mailových domén (HOTOVO, v1 §3.3.2)
  const emailSuggestion = (() => {
    const at = email.indexOf("@");
    if (at < 1) return null;
    const local = email.slice(0, at);
    const dom = email.slice(at + 1).toLowerCase();
    const TYPOS: Record<string, string> = {
      "gmial.com": "gmail.com", "gmal.com": "gmail.com", "gamil.com": "gmail.com",
      "gmail.cz": "gmail.com", "semzam.cz": "seznam.cz", "seznma.cz": "seznam.cz",
      "sezam.cz": "seznam.cz", "centurm.cz": "centrum.cz",
    };
    if (TYPOS[dom]) return `${local}@${TYPOS[dom]}`;
    const KNOWN = ["seznam.cz", "email.cz", "gmail.com", "centrum.cz", "atlas.cz"];
    if (dom && !dom.includes(".")) {
      const hit = KNOWN.find((k) => k.startsWith(dom));
      if (hit) return `${local}@${hit}`;
    }
    return null;
  })();

  async function fetchCredits(): Promise<number> {
    try {
      const r = await fetch("/api/credits").then((x) => x.json());
      const b = typeof r.balance === "number" ? r.balance : 0;
      setCreditsState(b);
      return b;
    } catch {
      setCreditsState(0);
      return 0;
    }
  }

  useEffect(() => {
    void fetchCredits();
    setSingles(getSinglePurchases());
    setIsFirst(!getFirstDone());
    const saved = getEmail();
    if (saved) {
      setEmail(saved);
      setEmailConfirmed(true);
    } else {
      // Po přihlášení kódem zná e-mail server (session) - převezmeme ho
      fetch("/api/auth/session")
        .then((r) => r.json())
        .then((s) => {
          if (s?.email) {
            persistEmail(s.email);
            setEmail(s.email);
            setEmailConfirmed(true);
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Otázka z úvodní stránky (?q=) → zpracovat rovnou
  useEffect(() => {
    const q = params.get("q")?.trim();
    if (q && !autoStarted.current) {
      autoStarted.current = true;
      void submitQuestion(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitQuestion(raw?: string) {
    const trimmed = (raw ?? question).trim();
    if (!trimmed) return;
    setQuestion(trimmed);
    setProcessing(true);

    // Moderace (krizová odpověď se NIKDY nezamyká za fólii - inv. 8)
    const mod = moderate(trimmed);
    if (mod !== "ok") {
      setStep(mod);
      setProcessing(false);
      return;
    }
    const cls = classify(trimmed);
    setSpread(cls.spread);
    setProcessing(false);
    if (FLOW_CLASSIC) {
      // Staré flow za flagem (5.5): platba PŘED rituálem, bez teaseru
      setStep("folie");
      return;
    }
    await startRitual(cls.spread);
  }

  async function startRitual(sp?: SpreadKey) {
    const res = await fetch("/api/session/shuffle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spread: sp ?? spread }),
    }).then((r) => r.json());
    setSessionId(res.sessionId);
    setStep("ritual");
  }

  // Po výběru karet („Zobrazit výklad"): kredit → rovnou celý výklad;
  // jinak teaser (úvod zdarma)
  async function onRitualComplete(picked: PickedCard[]) {
    setCards(picked);
    if (FLOW_CLASSIC) {
      setStep("reading");
      return;
    }
    if (creditsEnabled && credits > 0) {
      // 5.3 d) fólie se nezobrazuje - výklad celý, kredit strhne server
      setCreditUsed(true);
      setStep("reading");
      return;
    }
    setStep("loadingTeaser");
    try {
      const res = await fetch("/api/reading/teaser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId, question, spread, cards: picked,
          email: emailConfirmed ? email : undefined,
        }),
      });
      const data = await res.json();
      if (data?.crisis) {
        setCrisisText(String(data.teaser ?? ""));
        setStep("teaser");
        return;
      }
      if (res.status === 429 || data?.limited) {
        setLimitedMsg(String(data?.message ?? ""));
        setStep("folie");
        return;
      }
      setTeaser(String(data.teaser ?? ""));
      setTeaserShown("");
      setStep("teaser");
    } catch {
      setStep("reading_error");
    }
  }

  // Teaser: postupné odhalování po slovech (úvod „se streamuje")
  useEffect(() => {
    if (step !== "teaser" || crisisText) return;
    if (!teaserEventSent.current) {
      teaserEventSent.current = true;
      logEvent("teaser_shown", { type: readingType(spread), stair });
      logEvent("question_category", {
        category: categorize(question), paid: false,
      });
    }
    const words = teaser.split(" ");
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTeaserShown(words.slice(0, i).join(" "));
      if (i >= words.length) {
        clearInterval(id);
        // po dostreamování úvodu nastoupí fólie
        setTimeout(() => setStep("folie"), 450);
      }
    }, 46);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function unlock() {
    if (payDisabled) return;
    logEvent("unlock_click", { type: readingType(spread), stair });
    setStep("paying");
    const wantFirst = stair === "a" && !introUsedServer;
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email || undefined,
        priceId: wantFirst ? PRICE_IDS.first : PRICE_IDS.single,
      }),
    });
    if (res.status === 409) {
      // 5.3 f) e-mail už nakupoval → server přepíná na 49 Kč
      setIntroUsedServer(true);
      setIsFirst(false);
      setStep("folie");
      return;
    }
    if (!res.ok) {
      setStep("payment_failed");
      return;
    }
    persistEmail(email);
    if (wantFirst) setFirstDone();
    else bumpSinglePurchases();
    setSingles(getSinglePurchases());
    logEvent("paid", {
      type: readingType(spread), stair,
      product: wantFirst ? "intro" : "single",
    });
    logEvent("question_category", {
      category: categorize(question), paid: true,
    });
    if (FLOW_CLASSIC) {
      await startRitual();
      return;
    }
    // Odemčení musí působit okamžitě: stream pokračování startuje hned
    setStep("reading");
  }

  const spreadDef = SPREADS[spread];
  const positions =
    spread === "between_us" ? betweenUsPositions(question) : spreadDef.positions;

  // Mini-nadpisy sekcí pro fólii (5.2: struktura viditelná)
  const folieSections =
    spread === "yesno"
      ? ["Kam se to kloní", "Co s tím", "Na co si dát pozor"]
      : ["Shrnutí", "Malý krok pro tebe"];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-20">
      {step === "question" && (
        <div className="py-12">
          {processing ? (
            <p className="py-16 text-center text-body-dim">Načítám…</p>
          ) : (
            <>
              {/* v1.6 §7.6 DOSLOVA */}
              <h1 className="font-display text-body">
                Napiš otázku vlastními slovy.
              </h1>
              <p className="mt-2 text-body-dim">Nomi ti vyloží karty.</p>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Napiš otázku vlastními slovy…"
                rows={3}
                className="mt-6 w-full rounded-2xl border border-surface bg-surface-2 p-4 text-body"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {QUESTION_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setQuestion(chip)}
                    className="rounded-full border border-accent-dim px-3 py-1.5 text-sm text-accent-soft hover:border-accent"
                  >
                    {chip}
                  </button>
                ))}
              </div>
              <button
                onClick={() => submitQuestion()}
                disabled={!question.trim()}
                className="btn-primary mt-6 w-full sm:w-auto"
              >
                Položit otázku
              </button>
            </>
          )}
        </div>
      )}

      {(step === "crisis_a" || step === "crisis_b" || step === "crisis_c") && (
        <CrisisScreen
          variant={step}
          spirioHref={`${SPIRIO_URL}?utm_source=tarotolasce&utm_medium=app&utm_campaign=most-po-vykladu`}
          onBack={() => setStep("question")}
        />
      )}

      {step === "ritual" && sessionId && (
        <Ritual
          sessionId={sessionId}
          cardCount={spreadDef.cardCount}
          positions={positions}
          onReshuffle={async () => {
            const res = await fetch("/api/session/shuffle", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ spread }),
            }).then((r) => r.json());
            setSessionId(res.sessionId);
            return res.sessionId as string;
          }}
          onComplete={onRitualComplete}
        />
      )}

      {step === "loadingTeaser" && (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-rose-500" />
          {/* v1.6 §7.9 DOSLOVA */}
          <p className="font-display text-xl text-body">Nomi připravuje tvůj výklad</p>
          <p className="text-sm text-body-dim">
            Dívá se na tvoji otázku a karty, které sis vybrala.
          </p>
        </div>
      )}

      {(step === "teaser" || step === "folie" || step === "paying" ||
        step === "payment_failed") && (
        <div className="py-10">
          {/* v1.6 §7.10 rámování. V OCHUTNÁVCE se skutečné karty NEUKAZUJÍ -
              jen se naznačí, že se karta/karty natáhly (rub nahoru + počet).
              Názvy a otočení karet patří až do zaplaceného výkladu. */}
          <h1 className="font-display text-body">Tvůj výklad</h1>
          <p className="mt-2 text-body-dim">Tvoje otázka: „{question}"</p>
          <p className="mt-4 text-xs uppercase tracking-wider text-body-dim">
            Tvoje karty
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2" aria-hidden>
            {cards.map((c, i) => (
              <CardBack key={c.cardId + i} className="h-24 w-16 drop-shadow-card" />
            ))}
          </div>
          <p className="mt-2 text-sm text-body-dim">
            Vytáhla sis {kartyAkuzativ(cards.length)}. Otočí se ti v celém
            výkladu.
          </p>

          {crisisText ? (
            // Krizová odpověď: celá, bez fólie a bez platby (invariant 8)
            <p className="prose-tarot mt-6 whitespace-pre-line text-lg text-body">
              {crisisText}
            </p>
          ) : (
            <>
              {!limitedMsg && (
                <>
                  <p className="mt-6 text-xs uppercase tracking-wider text-body-dim">
                    Začátek tvého výkladu:
                  </p>
                  <p className="prose-tarot mt-2 whitespace-pre-line text-lg text-body">
                    {step === "teaser" ? teaserShown : teaser}
                  </p>
                </>
              )}

              {(step === "folie" || step === "paying" || step === "payment_failed") && (
                <>
                  {limitedMsg && (
                    <p className="mt-6 rounded-2xl border border-accent-dim bg-surface p-4 text-body">
                      {limitedMsg}
                    </p>
                  )}

                  {/* OPONA: zbytek výkladu je za nečitelnou clonou. Uvnitř
                      jsou jen anonymní řádky (ne názvy karet ani pozice) -
                      naznačují rozsah, neprozrazují obsah. V classic režimu
                      se opona neukazuje (platba je před výběrem karet). */}
                  <div
                    className="relative mt-6 overflow-hidden rounded-2xl border border-surface"
                    aria-hidden
                    style={{ display: FLOW_CLASSIC ? "none" : undefined }}
                  >
                    <div className="space-y-5 p-6 blur-[6px]">
                      {cards.slice(1).map((c, i) => (
                        <div key={c.cardId + i}>
                          <div className="h-4 w-1/3 rounded bg-body/25" />
                          <div className="mt-2 space-y-1.5">
                            <div className="h-3.5 w-full rounded bg-body/15" />
                            <div className="h-3.5 w-11/12 rounded bg-body/15" />
                          </div>
                        </div>
                      ))}
                      {folieSections.map((h) => (
                        <div key={h}>
                          <div className="h-4 w-1/4 rounded bg-body/25" />
                          <div className="mt-2 space-y-1.5">
                            <div className="h-3.5 w-full rounded bg-body/15" />
                            <div className="h-3.5 w-10/12 rounded bg-body/15" />
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* neprůhledná opona přes spodní část */}
                    <div className="pointer-events-none absolute inset-0 bg-surface/80" />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center pb-6">
                      <span className="rounded-full border border-surface bg-surface px-4 py-2 text-sm text-body-dim">
                        Zbytek výkladu se odemkne po zaplacení
                      </span>
                    </div>
                  </div>

                  {/* 5.3 platební schodiště */}
                  <div className="mt-8 rounded-2xl border border-surface bg-surface p-6">
                    {step === "payment_failed" && (
                      <p className="mb-4 text-sm text-accent-soft">
                        Platba neprošla. Nic jsme ti nestrhli - zkus to prosím znovu.
                      </p>
                    )}

                    {stair === "a" ? (
                      <>
                        {/* 5.3 a) první nákup DOSLOVA */}
                        <p className="font-display text-2xl font-semibold text-body">
                          Odemkni si celý výklad
                        </p>
                        <p className="mt-1 text-body">
                          <strong className="lining-nums-price">{PRICES.first} Kč</strong>{" "}
                          <span className="text-body-dim">(běžně {PRICES.single} Kč)</span>
                        </p>
                        <p className="mt-4 text-sm font-medium text-body">Tvůj e-mail</p>
                        <p className="text-xs text-body-dim">
                          Pod tímto e-mailem ti výklad uložíme, aby ses k němu
                          mohla vrátit.
                        </p>
                        <input
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setEmailConfirmed(false); }}
                          placeholder="tvuj@email.cz"
                          className="mt-2 w-full rounded-xl border border-surface bg-surface-2 p-3 text-body"
                        />
                        {emailSuggestion && emailSuggestion !== email && (
                          <button
                            onClick={() => setEmail(emailSuggestion)}
                            className="mt-1 text-xs text-accent-soft underline underline-offset-2"
                          >
                            Myslela jsi {emailSuggestion}?
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {/* 5.3 b) vracející se: jedno klepnutí */}
                        <p className="font-display text-2xl font-semibold text-body">
                          Odemknout výklad · {PRICES.single} Kč
                        </p>
                        {introUsedServer && (
                          <p className="mt-2 text-sm text-body-dim">
                            Máš u nás účet — pošleme ti kód a odemkneš uloženou
                            kartou.{" "}
                            <Link href="/prihlaseni" className="text-accent-soft underline underline-offset-2">
                              Přihlásit se
                            </Link>
                          </p>
                        )}
                      </>
                    )}

                    {SHOW_1837_CONSENT && (
                      <label className="mt-5 flex items-start gap-3 text-xs text-body-dim">
                        <input
                          type="checkbox"
                          checked={consent}
                          onChange={(e) => setConsent(e.target.checked)}
                          className="mt-0.5 h-4 w-4 accent-rose-500"
                        />
                        <span>
                          Souhlasím s dodáním digitálního obsahu ihned po zaplacení a
                          beru na vědomí, že tím ztrácím právo na odstoupení od smlouvy
                          ve 14denní lhůtě.
                        </span>
                      </label>
                    )}

                    <div className="mt-5 grid gap-3">
                      {isApplePlatform ? (
                        <button
                          onClick={unlock}
                          disabled={payDisabled}
                          className="rounded-full bg-black px-6 py-3.5 font-semibold text-white hover:bg-neutral-900 disabled:opacity-60"
                        >
                          {step === "paying" ? "Zpracovává se…" : "Apple Pay"}
                        </button>
                      ) : (
                        <GooglePayButton
                          onClick={unlock}
                          disabled={payDisabled}
                          busy={step === "paying"}
                        />
                      )}
                      <button onClick={unlock} disabled={payDisabled} className="btn-primary">
                        {step === "paying" ? "Zpracovává se…" : "Zaplatit kartou"}
                      </button>
                    </div>

                    {stair === "a" && (
                      <p className="mt-4 text-xs text-body-dim">
                        Když ti první výklad nic nedá, napiš nám a {PRICES.first} Kč
                        ti vrátíme.
                      </p>
                    )}
                    {stair !== "a" && (
                      <p className="mt-4 text-xs text-body-dim">
                        Ptáš se častěji? 5 výkladů za {PRICES.pack5} Kč — vychází na
                        40 Kč za výklad. ·{" "}
                        <Link href="/cenik" className="text-accent-soft underline underline-offset-2">
                          všechny balíčky
                        </Link>
                      </p>
                    )}
                    {stair === "c" && (
                      <p className="mt-2 text-xs text-body-dim">
                        Tohle je tvůj třetí výklad tenhle měsíc — s balíčkem 5
                        výkladů bys ušetřila.
                      </p>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {(step === "reading" || step === "paths" || step === "reading_error") && (
        <div className="py-10">
          {/* v1.6 §7.10 rámování */}
          <h1 className="font-display text-body">Tvůj výklad</h1>
          <p className="mt-2 text-body-dim">Tvoje otázka: „{question}"</p>
          <p className="mt-4 text-xs uppercase tracking-wider text-body-dim">Tvoje karty</p>
          <p className="mt-1 text-body">
            {cards.map((c) => `${c.name}${c.reversed ? " (obráceně)" : ""}`).join(" · ")}
          </p>
          {creditUsed && (
            <p className="mt-3 text-sm text-body-dim">
              Odemčeno z balíčku · zbývají{" "}
              {vykladu(Math.max(0, credits - 1))}.
            </p>
          )}
          <p className="mt-6 text-xs uppercase tracking-wider text-body-dim">
            Tohle se ve tvém výkladu ukazuje nejsilněji:
          </p>

          {step === "reading_error" ? (
            <div className="mt-6 rounded-2xl border border-surface bg-surface p-6">
              <p className="text-body">Výklad se nepodařilo načíst.</p>
              <button onClick={() => setStep("reading")} className="btn-primary mt-4">
                Zkusit znovu
              </button>
            </div>
          ) : (
            <ReadingStream
              sessionId={sessionId}
              question={question}
              spread={spread}
              cards={cards}
              useCredit={creditUsed}
              flowB={!FLOW_CLASSIC && !creditUsed}
              teaser={!FLOW_CLASSIC && !creditUsed ? teaser : ""}
              onMeta={(id) => setReadingId(id)}
              onError={() => setStep("reading_error")}
              onDone={() => {
                if (!countedRef.current) {
                  countedRef.current = true;
                  bumpReadingCount();
                  logEvent("reading_completed", { spread, type: readingType(spread) });
                }
                setStep("paths");
              }}
            />
          )}

          {step === "paths" && (
            <>
              <p className="mt-6 text-sm text-body-dim">
                Výklad máš uložený v historii.
              </p>
              {readingId && <ReadingFeedback readingId={readingId} spread={spread} />}
              <ThreePaths spread={spread} credits={credits} singlePurchases={singles} />
            </>
          )}
        </div>
      )}
    </main>
  );
}

export default function NovyVykladPage() {
  return (
    <Suspense fallback={<p className="py-16 text-center text-body-dim">Načítám…</p>}>
      <FlowInner />
    </Suspense>
  );
}
