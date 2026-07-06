"use client";
// Hlavní flow (kapitola 5): otázka → moderace → klasifikace → checkout
// → platba (mock) → rituál → streamovaný výklad → 3 cesty.
// Aplikační stránka, noindex (viz layout v této složce).
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import CrisisScreen from "@/components/CrisisScreen";
import Ritual, { PickedCard } from "@/components/Ritual";
import ReadingStream from "@/components/ReadingStream";
import ThreePaths from "@/components/ThreePaths";
import ReadingFeedback from "@/components/ReadingFeedback";
import { spirioUrl } from "@/components/SpirioCTA";
import { SPREADS, SpreadKey, betweenUsPositions } from "@/lib/spreads";
import { PRICES, PRICE_IDS } from "@/lib/pricing";
import { vykladu } from "@/lib/declension";
import { useCreditsEnabled } from "@/lib/flags";
import { logEvent } from "@/lib/analytics";
import {
  getSinglePurchases, bumpSinglePurchases,
  getFirstDone, setFirstDone, getEmail, setEmail as persistEmail,
  bumpReadingCount,
} from "@/lib/clientState";

type Step =
  | "question"
  | "crisis_a" | "crisis_b" | "crisis_c"
  | "checkout"
  | "paying"
  | "payment_failed"
  | "ritual"
  | "reading"
  | "reading_error"
  | "paths";

import { QUESTION_CHIPS } from "@/lib/chips";
import GooglePayButton from "@/components/GooglePayButton";

function FlowInner() {
  const creditsEnabled = useCreditsEnabled();
  const params = useSearchParams();
  const [step, setStep] = useState<Step>("question");
  const [question, setQuestion] = useState(params.get("q") ?? "");
  const [spread, setSpread] = useState<Exclude<SpreadKey, "daily">>("between_us");
  const [showSpreadPicker, setShowSpreadPicker] = useState(false);
  const [email, setEmail] = useState("");
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [consent, setConsent] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [cards, setCards] = useState<PickedCard[]>([]);
  const [readingId, setReadingId] = useState("");
  const [credits, setCreditsState] = useState(0);
  const [singles, setSingles] = useState(0);
  const [isFirst, setIsFirst] = useState(true);
  const [creditUsed, setCreditUsed] = useState(false);
  // Otázka přišla z úvodní stránky (?q=) → zpracovat rovnou, neukazovat
  // formulář podruhé. processing drží mezistav, než se rozhodne další krok.
  const [processing, setProcessing] = useState(!!params.get("q")?.trim());
  const autoStarted = useRef(false);
  const countedRef = useRef(false); // výklad se počítá jen jednou
  // Platforma pro brandované platební tlačítko (v1 §5): nikdy obě naráz
  const [isApplePlatform, setIsApplePlatform] = useState(false);
  useEffect(() => {
    setIsApplePlatform(/Mac|iPhone|iPad|iPod/.test(navigator.userAgent));
  }, []);
  const payDisabled = !consent || !email.includes("@") || step === "paying";
  const paywallSeen = useRef(false);
  useEffect(() => {
    if (step === "checkout" && !paywallSeen.current) {
      paywallSeen.current = true;
      logEvent("paywall_view", { spread });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);
  // Našeptávač e-mailových domén + oprava překlepů (v1 §3.3.2)
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

  // Kredity = serverový zůstatek účtu (přes session), ne cookie.
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Automaticky zpracuj otázku z úvodní stránky (jen jednou)
  useEffect(() => {
    const q = params.get("q")?.trim();
    if (q && !autoStarted.current) {
      autoStarted.current = true;
      submitQuestion(q).finally(() => setProcessing(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitQuestion(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setQuestion(trimmed);
    // 2. Moderace (neviditelná)
    const mod = await fetch("/api/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: trimmed }),
    }).then((r) => r.json());
    if (mod.status !== "ok") {
      setStep(mod.status as Step);
      return;
    }
    // 3. Klasifikace (neviditelná)
    const cls = await fetch("/api/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: trimmed }),
    }).then((r) => r.json());
    setSpread(cls.spread);
    // Má kredit z balíčku → bez platby. Pokud už známe e-mail, jdeme rovnou
    // do rituálu; jinak zobrazíme odlehčený checkout jen pro e-mail a souhlas
    // (bez platebních tlačítek). Kredit se strhne až při vydání výkladu (7.5),
    // zůstatek rozhoduje server (účet přes session).
    if (creditsEnabled && getEmail() && (await fetchCredits()) > 0) {
      await startRitual(cls.spread);
      return;
    }
    setStep("checkout");
  }

  async function pay() {
    if (!consent || !email.includes("@")) return;
    // Má kredit z balíčku → bez platby
    if (creditsEnabled && credits > 0) {
      persistEmail(email);
      await startRitual(spread);
      return;
    }
    setStep("paying");
    let wantFirst = isFirst;
    let res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        priceId: wantFirst ? PRICE_IDS.first : PRICE_IDS.single,
      }),
    });
    // Intro už bylo na tomto účtu použito (rozhoduje server) → automaticky
    // zopakuj nákup jako běžný výklad za 49 Kč a přepni zobrazenou cenu.
    if (res.status === 409) {
      const body = await res.json().catch(() => ({}));
      if (body?.error === "intro_used" && body?.useSingle) {
        wantFirst = false;
        setIsFirst(false);
        setFirstDone();
        res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, priceId: PRICE_IDS.single }),
        });
      }
    }
    if (!res.ok) {
      setStep("payment_failed");
      return;
    }
    logEvent("payment_success", {
      spread,
      product: wantFirst ? "intro" : "single",
    });
    persistEmail(email);
    if (wantFirst) setFirstDone();
    else {
      bumpSinglePurchases();
      setSingles((s) => s + 1);
    }
    await startRitual();
  }

  async function startRitual(useSpread?: typeof spread) {
    const sp = useSpread ?? spread;
    const res = await fetch("/api/session/shuffle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spread: sp }),
    }).then((r) => r.json());
    setSessionId(res.sessionId);
    setStep("ritual");
  }

  function onRitualComplete(picked: PickedCard[]) {
    setCards(picked);
    // Kredit strhává server při vydání výkladu (idempotentně na sessionId);
    // tady si jen pamatujeme, že tenhle výklad jede z balíčku.
    if (creditsEnabled && credits > 0) {
      setCreditUsed(true);
    }
    setStep("reading");
  }

  const spreadDef = SPREADS[spread];
  const positions =
    spread === "between_us" ? betweenUsPositions(question) : spreadDef.positions;
  const price = isFirst ? PRICES.first : PRICES.single;

  // ---------- KROK: OTÁZKA ----------
  if (step === "question") {
    // Otázka přišla z úvodní stránky a právě se zpracovává → krátký mezistav,
    // ne formulář podruhé.
    if (processing) {
      return (
        <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-4 py-12 text-center">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-rose-500" />
          <p className="font-display text-2xl text-body">Připravuji tvé karty…</p>
        </div>
      );
    }
    return (
      <div className="py-12">
        <h1 className="font-display text-[42px] leading-[1.1] font-semibold text-body">
          Na co se chceš zeptat?
        </h1>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          placeholder="Napiš otázku vlastními slovy…"
          className="mt-6 w-full rounded-2xl border border-surface bg-surface p-4 text-lg text-body placeholder:text-body-dim/60 focus:border-accent"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {QUESTION_CHIPS.map((s) => (
            <button
              key={s}
              onClick={() => submitQuestion(s)}
              className="rounded-full border border-surface px-4 py-2 text-sm text-body-dim hover:border-accent-dim hover:text-body"
            >
              {s}
            </button>
          ))}
        </div>
        {/* v1.3 §3.2: disabled stav nese text „Nejdřív napiš otázku";
            po napsání se přepne na plné CTA „Pokračovat ke kartám". */}
        <button
          onClick={() => submitQuestion(question)}
          disabled={!question.trim()}
          className="btn-primary mt-8 w-full sm:w-auto"
        >
          {question.trim() ? "Pokračovat ke kartám" : "Nejdřív napiš otázku"}
        </button>
      </div>
    );
  }

  // ---------- KRIZOVÉ OBRAZOVKY ----------
  if (step === "crisis_a" || step === "crisis_b" || step === "crisis_c") {
    return (
      <CrisisScreen
        variant={step}
        spirioHref={spirioUrl("none", "krize")}
        onBack={() => {
          setQuestion("");
          setStep("question");
        }}
      />
    );
  }

  // ---------- CHECKOUT (texty 7.1 doslovně) ----------
  if (step === "checkout" || step === "paying" || step === "payment_failed") {
    return (
      <div className="py-12">
        {step === "payment_failed" ? (
          <div className="rounded-2xl border border-surface bg-surface p-6">
            <h1 className="font-display text-[40px] leading-[1.12] font-semibold text-body">
              Platba neproběhla.
            </h1>
            <p className="mt-3 text-body-dim">
              Nic jsme ti nestrhli. Zkus to znovu, nebo vyber jinou platební
              metodu. Tvoje otázka i karty zůstávají připravené.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setStep("checkout")}
                className="rounded-xl bg-rose-500 px-6 py-3 font-medium text-plum-900 hover:opacity-90"
              >
                Zkusit znovu
              </button>
              <button
                onClick={() => setStep("checkout")}
                className="rounded-xl border border-surface px-6 py-3 text-body-dim hover:text-body"
              >
                Jiná platební metoda
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* v1.3 §3.7: nadpis DOSLOVA („Nomi na tebe čeká" zrušeno -
                personifikace u platby působila přehnaně). */}
            <h1 className="font-display text-[42px] leading-[1.1] font-semibold text-body">
              Ještě jeden krok ke kartám.
            </h1>
            <p className="mt-3 text-body-dim">
              Po zaplacení si vybereš karty a výklad se ti uloží do historie.
            </p>
            <p className="mt-4 text-body-dim">
              Tvoje otázka: „{question}"
              <br />
              Rozklad: {spreadDef.name}
            </p>
            <button
              onClick={() => setShowSpreadPicker((v) => !v)}
              className="mt-2 text-sm text-body-dim underline decoration-rose-500/40 underline-offset-4 hover:text-body"
            >
              Raději chci jiný rozklad
            </button>
            {showSpreadPicker && (
              <div className="mt-3 flex flex-col gap-2">
                {(["yesno", "between_us", "my_ex"] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => {
                      setSpread(k);
                      setShowSpreadPicker(false);
                    }}
                    className={`rounded-xl border px-4 py-3 text-left text-sm ${
                      spread === k
                        ? "border-accent text-body"
                        : "border-surface text-body-dim hover:text-body"
                    }`}
                  >
                    {SPREADS[k].name} · {SPREADS[k].cardCount}{" "}
                    {SPREADS[k].cardCount === 1 ? "karta" : SPREADS[k].cardCount <= 4 ? "karty" : "karet"}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-8 rounded-2xl border border-accent-dim/40 bg-surface p-6">
              <p className="font-display text-2xl text-accent-soft lining-nums-price">
                {creditsEnabled && credits > 0
                  ? "Výklad z tvého balíčku"
                  : isFirst
                    ? `První výklad za ${PRICES.first} Kč (běžně ${PRICES.single} Kč)`
                    : `Výklad za ${price} Kč`}
              </p>

              <div className="mt-6">
                {emailConfirmed ? (
                  <p className="text-sm text-body-dim">
                    Výklad ti uložíme na {email} ·{" "}
                    <button
                      onClick={() => setEmailConfirmed(false)}
                      className="underline underline-offset-2 hover:text-body"
                    >
                      upravit
                    </button>
                  </p>
                ) : (
                  <>
                    <label htmlFor="email" className="block text-sm text-body">
                      Tvůj e-mail
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => { if (email.includes("@")) { setEmailConfirmed(true); logEvent("email_entered", {}); } }}
                      className="mt-2 w-full rounded-xl border border-surface bg-surface-2 p-3 text-body focus:border-accent"
                    />
                    {emailSuggestion && (
                      <button
                        type="button"
                        onClick={() => setEmail(emailSuggestion)}
                        className="mt-2 text-xs text-accent-soft underline underline-offset-2"
                      >
                        Myslela jsi {emailSuggestion}?
                      </button>
                    )}
                    <p className="mt-2 text-xs text-body-dim">
                      Sem ti výklad uložíme, ať se k němu můžeš kdykoli vrátit.
                      A každé ráno ti pošleme kartu dne zdarma. Žádné heslo,
                      žádné ověřování.
                    </p>
                  </>
                )}
              </div>

              <label className="mt-6 flex items-start gap-3 text-xs text-body-dim">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => { setConsent(e.target.checked); if (e.target.checked) logEvent("consent_checked", {}); }}
                  className="mt-0.5 h-4 w-4 accent-rose-500"
                  required
                />
                <span>
                  Souhlasím s dodáním digitálního obsahu ihned po zaplacení a
                  beru na vědomí, že tím ztrácím právo na odstoupení od smlouvy
                  ve 14denní lhůtě.
                </span>
              </label>

              <div className="mt-6 grid gap-3">
                {creditsEnabled && credits > 0 ? (
                  <button
                    onClick={pay}
                    disabled={!consent || !email.includes("@")}
                    className="btn-primary"
                  >
                    Použít výklad z balíčku
                  </button>
                ) : (
                  <>
                    {isApplePlatform ? (
                      <button
                        onClick={pay}
                        disabled={payDisabled}
                        className="rounded-xl bg-black px-6 py-3.5 font-semibold text-white hover:bg-neutral-900 disabled:opacity-60 disabled:saturate-[.35]"
                      >
                        {step === "paying" ? "Zpracovává se…" : "Apple Pay"}
                      </button>
                    ) : (
                      /* v1.3 §6 bug 2: oficiální brandovaný GPay badge
                         (v produkci ho vykreslí Stripe Express Checkout
                         Element; do té doby brandovaná komponenta). */
                      <GooglePayButton
                        onClick={pay}
                        disabled={payDisabled}
                        busy={step === "paying"}
                      />
                    )}
                    <button
                      onClick={pay}
                      disabled={payDisabled}
                      className="btn-primary"
                    >
                      {step === "paying" ? "Zpracovává se…" : "Zaplatit a pokračovat ke kartám"}
                    </button>
                  </>
                )}
              </div>
              {!consent && (
                <p className="mt-2 text-xs text-accent-soft">Nejdřív potvrď souhlas výše.</p>
              )}

              <p className="mt-5 text-xs text-body-dim">
                {creditsEnabled && credits > 0
                  ? `Výklady generuje AI. Po vydání výkladu ti ${vykladu(credits - 1)}.`
                  : `Výklady generuje AI. Pokud ti první výklad nic nedá, napiš nám a ${PRICES.first} Kč ti vrátíme.`}
              </p>
            </div>
          </>
        )}
      </div>
    );
  }

  // ---------- RITUÁL ----------
  if (step === "ritual") {
    return (
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
    );
  }

  // ---------- VÝKLAD + 3 CESTY ----------
  if (step === "reading" || step === "paths" || step === "reading_error") {
    return (
      <div className="py-8">
        {/* Rozložené karty zůstávají nahoře */}
        <div className="mx-auto grid max-w-xl grid-cols-3 gap-3">
          {cards.map((c) => (
            <div key={c.position} className="text-center">
              <span className="text-[11px] leading-tight text-accent-soft">{c.position}</span>
              <div className="mt-1 rounded-lg border border-surface bg-cream/95 p-2 text-plum-900">
                <span className="block text-2xl">{c.symbol ?? "✦"}</span>
                <span className="block text-[11px] font-medium leading-tight">
                  {c.name}
                  {c.reversed ? " (obráceně)" : ""}
                </span>
              </div>
            </div>
          ))}
        </div>

        {step === "reading_error" ? (
          <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-surface bg-surface p-6">
            <h2 className="font-display text-[30px] leading-[1.15] font-semibold text-body">
              Karty potřebují chvilku navíc.
            </h2>
            <p className="mt-3 text-body-dim">
              Výklad se připravuje déle, než je obvyklé. Máš ho zaplacený a
              nikam nezmizí. Zkus obnovit stránku, nebo se vrať za pár minut.
              Výklad najdeš ve své historii.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 rounded-xl bg-rose-500 px-6 py-3 font-medium text-plum-900 hover:opacity-90"
            >
              Obnovit stránku
            </button>
          </div>
        ) : (
          <ReadingStream
            sessionId={sessionId}
            question={question}
            spread={spread}
            cards={cards}
            useCredit={creditUsed}
            onMeta={(id) => {
              setReadingId(id);
              // Cesta ke průvodkyni: napočítej výklad (jen jednou na výklad)
              if (!countedRef.current) {
                countedRef.current = true;
                bumpReadingCount();
              }
              // Refresh-safe: jakmile je výklad uložený na serveru, přepíšeme
              // URL na kanonickou /vyklad/[id]. Obnovení stránky (i během
              // streamování) tak skončí na server-rendered uloženém výkladu,
              // ne zpět na otázce. Bez tvrdé navigace, stream běží dál.
              window.history.replaceState(null, "", `/vyklad/${id}`);
            }}
            onDone={() => {
              logEvent("reading_completed", { spread });
              // Serverový zůstatek po případném čerpání kreditu
              void fetchCredits();
              setStep("paths");
            }}
            onError={() => {
              // Kredit se NIKDY nestrhne za nevydaný výklad - to hlídá
              // server (čerpá až s vydáním); tady jen obnovíme zůstatek.
              setCreditUsed(false);
              void fetchCredits();
              setStep("reading_error");
            }}
          />
        )}

        {step === "paths" && (
          <>
            {readingId && <ReadingFeedback readingId={readingId} />}
            <ThreePaths spread={spread} credits={credits} singlePurchases={singles} />
            {readingId && (
              <div className="mt-8 text-center">
                <Link
                  href="/historie"
                  className="inline-block rounded-xl bg-rose-500 px-6 py-3 font-medium text-plum-900 hover:opacity-90"
                >
                  Otevřít historii
                </Link>
                <p className="mt-3 text-sm text-body-dim">
                  Trvalý odkaz na výklad:{" "}
                  <Link href={`/vyklad/${readingId}`} className="text-body-dim underline underline-offset-2 hover:text-body">
                    otevřít uložený výklad
                  </Link>
                </p>
              </div>
            )}
            <p className="mt-10 border-t border-surface pt-6 text-center text-xs text-body-dim">
              Tarot o Lásce je nástroj reflexe pro zábavu a sebepoznání.
              Nenahrazuje profesionální terapii ani medicínskou péči. V krizi
              kontaktuj Linku první psychické pomoci: 116 123.
            </p>
          </>
        )}
      </div>
    );
  }

  return null;
}

export default function NovyVykladPage() {
  return (
    <Suspense>
      <FlowInner />
    </Suspense>
  );
}
