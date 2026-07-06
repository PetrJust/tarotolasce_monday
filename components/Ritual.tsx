"use client";
// Rituál výběru karet (follow-up prompt 1). Rituál JE produkt.
// Fáze 0 vějíř (oblouk) → 1 míchání (reálné, server re-shuffle) → 2 výběr
// (zvednutí, držená řada, krok zpět) → 3 reveal (sekvenční 3D flip, obrácení
// má vlastní moment) → předání nahoru pro streaming výkladu.
// Animace jen přes transform a opacity. prefers-reduced-motion: rozlet a flip
// nahrazeny crossfady, struktura a časování zůstávají.
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { CardBack, CardFace } from "./TarotCard";
import { CARD_BY_ID } from "@/lib/cards";
import { useShuffleSound } from "./useShuffleSound";
import { vyberKaret } from "@/lib/declension";

export type PickedCard = {
  cardId: string;
  name: string;
  reversed: boolean;
  position: string;
  symbol?: string;
};

type Phase = "intro" | "shuffling" | "picking" | "revealing" | "done";
type Held = { index: number; card: PickedCard };

const DECK_SIZE = 78;

function symbolFor(name: string): string {
  if (name.includes("pohárů")) return "∪";
  if (name.includes("mečů")) return "†";
  if (name.includes("holí")) return "|";
  if (name.includes("pentaklů")) return "✪";
  return "✦";
}

export default function Ritual({
  sessionId,
  cardCount,
  positions,
  onReshuffle,
  onComplete,
}: {
  sessionId: string;
  cardCount: number;
  positions: string[];
  // Znovu zamíchá na serveru a vrátí nové sessionId (reálné míchání)
  onReshuffle?: () => Promise<string>;
  onComplete: (cards: PickedCard[]) => void;
}) {
  const reducedMotion = useReducedMotion();
  const playShuffle = useShuffleSound(true);

  const [phase, setPhase] = useState<Phase>("intro");
  const [activeSession, setActiveSession] = useState(sessionId);
  const [held, setHeld] = useState<Held[]>([]);
  const [busyIndex, setBusyIndex] = useState<number | null>(null);
  const [flippedCount, setFlippedCount] = useState(0);
  const [settledReversed, setSettledReversed] = useState<number[]>([]);
  const [soundOn, setSoundOn] = useState(!reducedMotion);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [shuffleNonce, setShuffleNonce] = useState(0);

  // prefers-reduced-motion mění výchozí stav zvuku
  useEffect(() => {
    setSoundOn(!reducedMotion);
  }, [reducedMotion]);

  // --- Geometrie vějíře (v1.1 §E: radiální kolo) ---
  // Střed kola leží POD spodní hranou kontejneru (cy = výška + ~110 px).
  // Všechny karty sedí v jediném rotujícím kontejneru: drag/setrvačnost/snap
  // mění jen jeden transform (60 fps). Tečné natočení vzniká samo z rotace.
  const [angle, setAngle] = useState(0); // rotace kola ve stupních (<= 0)
  const angleRef = useRef(0);
  const velocityRef = useRef(0); // °/frame
  const draggingRef = useRef(false);
  const movedRef = useRef(0); // rozliší tap od dragu
  const lastXRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const snappingRef = useRef(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const wheelRef = useRef<HTMLDivElement | null>(null);
  const [vw, setVw] = useState(390);

  useEffect(() => {
    const update = () => setVw(viewportRef.current?.clientWidth ?? window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const cardW = vw < 360 ? 44 : vw < 480 ? 52 : 64; // min 44 px = tap cíl
  const cardH = Math.round(cardW * 2.5);
  // Poloměr ~300–340 podle šířky; krok vyladěný na viditelnou hranu
  // ~24 px (hrana = r * krok_rad), v mezích ~5–6,5°. Finální doladění
  // kroku/hrany patří na reálné zařízení (checklist E).
  const radius = Math.min(340, Math.max(300, Math.round(vw * 0.82)));
  const stepDeg = Math.min(6.5, Math.max(5, (24 / radius) * (180 / Math.PI)));
  const WINDOW_DEG = 60; // vykresluje se okno ~120° (±60°)
  const fanH = Math.round(radius + cardH / 2 - 110 + 12);
  const cx = vw / 2;
  const cy = fanH + 110;
  const K = 0.35; // °/px (citlivost dragu dle E)
  const minAngle = -(DECK_SIZE - 1) * stepDeg;

  const applyAngle = useCallback((a: number, withTransition: boolean) => {
    const clamped = Math.max(minAngle, Math.min(0, a));
    angleRef.current = clamped;
    const el = wheelRef.current;
    if (el) {
      el.style.transition = withTransition ? "transform 0.24s cubic-bezier(0.22,1,0.36,1)" : "none";
      el.style.transform = `rotate(${clamped}deg)`;
    }
    // stav jen pro virtualizaci + fokus (levné, mění se po celých kartách)
    const idx = Math.round(-clamped / stepDeg);
    setFocusedIndex((prev) => (prev === idx ? prev : idx));
    setAngle(clamped);
  }, [minAngle, stepDeg]);

  // Snap na násobek kroku + haptika (E)
  const snapToNearest = useCallback(() => {
    const target = -Math.round(-angleRef.current / stepDeg) * stepDeg;
    if (Math.abs(target - angleRef.current) > 0.01) {
      snappingRef.current = true;
      applyAngle(target, true);
      navigator.vibrate?.(3);
      setTimeout(() => { snappingRef.current = false; }, 260);
    }
  }, [applyAngle, stepDeg]);

  // Setrvačnost: decay ~0,95/frame, pak snap
  const startMomentum = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const tick = () => {
      if (draggingRef.current) return;
      velocityRef.current *= 0.95;
      if (Math.abs(velocityRef.current) < 0.04) {
        velocityRef.current = 0;
        snapToNearest();
        return;
      }
      applyAngle(angleRef.current + velocityRef.current, false);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [applyAngle, snapToNearest]);

  // Dorolování na konkrétní kartu (tap mimo střed, klávesnice)
  const rollTo = useCallback((i: number) => {
    velocityRef.current = 0;
    applyAngle(-i * stepDeg, true);
    navigator.vibrate?.(3);
  }, [applyAngle, stepDeg]);

  function onPointerDown(e: React.PointerEvent) {
    if (phase !== "picking") return;
    draggingRef.current = true;
    movedRef.current = 0;
    lastXRef.current = e.clientX;
    velocityRef.current = 0;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    movedRef.current += Math.abs(dx);
    const dAngle = dx * K; // rotace += dx * k
    velocityRef.current = dAngle;
    applyAngle(angleRef.current + dAngle, false);
  }
  function onPointerUp() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    startMomentum();
  }

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  // --- Míchání (reálné: re-shuffle na serveru) ---
  async function doShuffle(first: boolean) {
    if (held.length > 0) return; // po první vybrané kartě je míchání vypnuté
    setPhase("shuffling");
    if (soundOn) playShuffle();
    if (!first && onReshuffle) {
      const newId = await onReshuffle();
      setActiveSession(newId);
    }
    setShuffleNonce((n) => n + 1); // přegeneruje vizuální pořadí (rozlet)
    // vstup do výběru: kolo vystředíme na střed balíčku
    const mid = Math.floor(DECK_SIZE / 2);
    setFocusedIndex(mid);
    angleRef.current = -mid * stepDeg;
    setAngle(angleRef.current);
    setTimeout(
      () => setPhase("picking"),
      reducedMotion ? 200 : 1200
    );
  }

  // --- Výběr karty ---
  async function pick(index: number) {
    if (phase !== "picking") return;
    if (held.some((h) => h.index === index)) return;
    if (held.length >= cardCount) return;
    if (busyIndex !== null) return;
    setBusyIndex(index);
    try {
      const res = await fetch("/api/session/pick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: activeSession, index }),
      });
      if (!res.ok) return;
      const card: PickedCard = await res.json();
      navigator.vibrate?.(12); // výběr (E)
      setHeld((h) => [...h, { index, card }]);
    } finally {
      setBusyIndex(null);
    }
  }

  // Krok zpět: vrátí drženou kartu zpět do vějíře (až do "Otočit karty").
  // Uvolní výběr i na serveru, aby počet i pořadí zůstaly konzistentní.
  function unpick(index: number) {
    if (phase !== "picking") return;
    setHeld((h) => h.filter((x) => x.index !== index));
    fetch("/api/session/unpick", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: activeSession, index }),
    }).catch(() => {
      /* mock: i kdyby selhalo, klient drží pravdu o výběru */
    });
  }

  // --- Reveal ---
  function reveal() {
    if (held.length !== cardCount) return;
    setPhase("revealing");
    const stepMs = reducedMotion ? 120 : 500;
    held.forEach((h, i) => {
      setTimeout(() => {
        setFlippedCount(i + 1);
        // Obrácená karta dostane vlastní moment (krátká pauza navíc),
        // pak se dotočí o 180°, aby bylo obrácení vizuálně jednoznačné.
        if (h.card.reversed) {
          setTimeout(
            () => setSettledReversed((r) => [...r, i]),
            reducedMotion ? 60 : 320
          );
        }
      }, stepMs * (i + 1));
    });
    const total = stepMs * held.length + (reducedMotion ? 200 : 400);
    setTimeout(() => {
      setPhase("done");
      onComplete(held.map((h) => h.card));
    }, total);
  }

  // --- Klávesnice (E): šipky = krok kola, Enter/mezerník = výběr středu ---
  function onKeyDown(e: React.KeyboardEvent) {
    if (phase !== "picking") return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      rollTo(Math.min(DECK_SIZE - 1, focusedIndex + 1));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      rollTo(Math.max(0, focusedIndex - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick(focusedIndex % DECK_SIZE); // logický index balíčku (E)
    }
  }

  const fanFull = held.length >= cardCount;

  // Virtualizace: vykresluje se jen okno ~120° kolem středu
  const halfWindow = Math.ceil(WINDOW_DEG / stepDeg) + 2;
  const lo = Math.max(0, focusedIndex - halfWindow);
  const hi = Math.min(DECK_SIZE, focusedIndex + halfWindow);

  return (
    <div className="flex min-h-[78dvh] flex-col gap-2">
      {/* ---------- HORNÍ OBLAST ---------- */}
      <div className={phase === "picking" ? "flex-none" : "flex-1"}>
        {phase === "intro" && (
          <div className="flex h-full flex-col items-center justify-center gap-8 py-16 text-center">
            {/* v1.3 §3.8: intro copy DOSLOVA. Bez jména (pravidlo
                frekvence); věta o klidu se sem stěhuje z hero. */}
            <p className="mx-auto max-w-md font-display text-3xl font-semibold leading-snug text-body">
              Na chvíli se zastav. Zůstaň u své otázky. Klidně, beze spěchu —
              až budeš připravená, zamícháme karty.
            </p>
            <button
              onClick={() => doShuffle(true)}
              className="btn-primary"
            >
              Zamíchat karty
            </button>
            {/* Nenápadný zvukový přepínač (F.6) */}
            <button
              onClick={() => setSoundOn((s) => !s)}
              aria-pressed={soundOn}
              className="text-xs text-body-dim/80 hover:text-body"
            >
              Zvuk šustění: {soundOn ? "zapnutý" : "vypnutý"}
            </button>
          </div>
        )}

        {phase === "shuffling" && (
          <div className="flex h-full flex-col items-center justify-center gap-6 py-20">
            <div className="relative h-44 w-28" aria-hidden>
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 will-change-transform"
                  animate={
                    reducedMotion
                      ? { opacity: [1, 0.6, 1] }
                      : { x: [0, i % 2 ? 40 : -40, 0], rotate: [0, i % 2 ? 10 : -10, 0] }
                  }
                  transition={{ duration: 0.55, repeat: 1, delay: i * 0.06 }}
                >
                  <CardBack className="h-full w-full drop-shadow-card" />
                </motion.div>
              ))}
            </div>
            <p className="text-body-dim">Karty se míchají jen pro tebe…</p>
          </div>
        )}

        {(phase === "picking" || phase === "revealing" || phase === "done") && (
          <div className="py-4">
            {phase === "picking" && (
              <div className="mb-4 text-center">
                <p className="font-display text-2xl font-semibold text-body">
                  {vyberKaret(cardCount)}
                </p>
                <p className="mt-1 text-sm text-body-dim">
                  Nehledej správnou. Vyber ty, které tě přitáhnou.
                </p>
                <p className="mt-1 text-sm text-body-dim" aria-live="polite">
                  {held.length} z {cardCount} vybráno
                </p>
              </div>
            )}

            {/* Držená řada (rubem nahoru) během výběru, s popisky pozic */}
            {phase === "picking" && (() => {
              // slot se vejde i pro 6 karet na úzkém displeji (s mezerami)
              const gap = cardCount >= 5 ? 6 : 10;
              const slotW = Math.max(
                36,
                Math.min(68, Math.floor((vw - gap * (cardCount + 1)) / cardCount))
              );
              const slotH = Math.round(slotW * 1.6);
              return (
              <div className="flex items-start justify-center" style={{ gap }}>
                {Array.from({ length: cardCount }).map((_, i) => {
                  const h = held[i];
                  const isNext = i === held.length; // pozice, kterou teď vybíráš
                  return (
                    <div key={i} className="flex flex-col items-center gap-1.5" style={{ width: slotW }}>
                      <span
                        className={`min-h-[28px] text-center text-[10px] leading-tight ${
                          isNext ? "text-accent" : "text-accent-soft"
                        }`}
                      >
                        {positions[i] ?? ""}
                      </span>
                      <div style={{ width: slotW, height: slotH }}>
                        <AnimatePresence>
                          {h ? (
                            <motion.button
                              key={h.index}
                              initial={{ opacity: 0, y: -30, scale: 0.8 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              onClick={() => unpick(h.index)}
                              aria-label={`Vrátit kartu pro pozici ${positions[i] ?? i + 1} zpět do vějíře`}
                              title="Klepni pro vrácení"
                              className="h-full w-full"
                            >
                              <CardBack className="h-full w-full drop-shadow-card" />
                            </motion.button>
                          ) : (
                            <div
                              className={`h-full w-full rounded-lg border border-dashed ${
                                isNext ? "border-accent-dim" : "border-surface"
                              }`}
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })}
              </div>
              );
            })()}

            {/* Pozice rozkladu (reveal) */}
            {(phase === "revealing" || phase === "done") && (
              <Spread
                held={held}
                positions={positions}
                cardCount={cardCount}
                flippedCount={flippedCount}
                reversedSettled={settledReversed}
                reducedMotion={!!reducedMotion}
              />
            )}

            {phase === "picking" && fanFull && (
              <div className="mt-6 text-center">
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={reveal}
                  className="btn-primary"
                >
                  Otočit karty
                </motion.button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---------- VĚJÍŘ (radiální kolo, E) ---------- */}
      {phase === "picking" && (
        <div className="flex flex-1 flex-col justify-end">
          <div
            ref={viewportRef}
            className="relative touch-none select-none overflow-hidden"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onKeyDown}
            tabIndex={0}
            role="listbox"
            aria-label="Vějíř 78 karet"
            aria-activedescendant={`fan-card-${focusedIndex}`}
            style={{
              height: fanH,
              filter: fanFull && !reducedMotion ? "brightness(0.5) blur(1px)" : undefined,
              transition: "filter 0.4s",
            }}
          >
          {/* Jediný rotující kontejner: střed kola pod spodní hranou */}
          <div
            ref={wheelRef}
            className="absolute will-change-transform"
            style={{
              left: cx,
              top: cy,
              width: 0,
              height: 0,
              transform: `rotate(${angle}deg)`,
            }}
          >
            {Array.from({ length: hi - lo }).map((_, k) => {
              const i = lo + k;
              const isHeld = held.some((h) => h.index === i);
              const focused = i === focusedIndex;
              const phi = i * stepDeg; // úhel karty v rámci kola
              // rotate → radiálně ven → vycentrovat; fokus: +12 px po normále,
              // scale 1.12 (E). Tečné natočení plyne z rotace samotné.
              const out = radius + (focused ? 12 : 0);
              return (
                <AnimatePresence key={i}>
                  {!isHeld && (
                    <motion.button
                      id={`fan-card-${i}`}
                      role="option"
                      aria-selected={focused}
                      aria-label={`Karta ${i + 1} z 78, rubem nahoru${focused ? ", uprostřed" : ""}`}
                      disabled={fanFull || busyIndex !== null}
                      onClick={() => {
                        if (movedRef.current > 8 || snappingRef.current) return; // drag není tap
                        if (focused) pick(i % DECK_SIZE); // jen střed je vybratelný (E)
                        else rollTo(i); // tap mimo střed = dorolování
                      }}
                      className="absolute left-0 top-0 disabled:pointer-events-none"
                      style={{
                        width: cardW,
                        height: cardH,
                        minWidth: 44, // tap cíl min. 44x44 (E)
                        transformOrigin: "0 0",
                        transform: `rotate(${phi}deg) translateY(${-out}px) translate(-50%, -50%) scale(${focused ? 1.12 : 1})`,
                        transition: draggingRef.current ? "none" : "transform 0.18s ease-out",
                        zIndex: focused ? 100 : i,
                      }}
                      initial={false}
                      exit={
                        reducedMotion
                          ? { opacity: 0 } // reduced motion: fade bez letu (E)
                          : { opacity: 0, y: -90, scale: 0.7, transition: { duration: 0.32 } }
                      }
                    >
                      <CardBack
                        className={`h-full w-full drop-shadow-card ${
                          focused ? "rounded-xl ring-2 ring-rose-500" : ""
                        }`}
                      />
                    </motion.button>
                  )}
                </AnimatePresence>
              );
            })}
          </div>

          {/* Tichý hint, dokud uživatelka nevybere první kartu */}
          {!fanFull && held.length === 0 && (
            <span className="pointer-events-none absolute inset-x-0 bottom-1 z-[60] text-center text-xs text-body-dim/80">
              Klepni na prostřední kartu, nebo táhni pro výběr
            </span>
          )}
          </div>

          {/* Zamíchat znovu: decentní odkaz pod vějířem (nekonkuruje hlavní akci) */}
          <div className="mt-2 flex justify-center">
            <button
              onClick={() => doShuffle(false)}
              disabled={held.length > 0}
              className="text-[13px] text-body-dim underline decoration-rose-500/40 underline-offset-4 hover:text-body disabled:no-underline disabled:opacity-35"
            >
              Zamíchat znovu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Rozklad karet s sekvenčním 3D flipem; obrácená karta má vlastní moment.
function Spread({
  held,
  positions,
  cardCount,
  flippedCount,
  reversedSettled,
  reducedMotion,
}: {
  held: Held[];
  positions: string[];
  cardCount: number;
  flippedCount: number;
  reversedSettled: number[];
  reducedMotion: boolean;
}) {
  const cols = cardCount === 1 ? "grid-cols-1 justify-items-center" : "grid-cols-3";
  return (
    <div className={`mx-auto grid max-w-xl gap-4 ${cols}`}>
      {Array.from({ length: cardCount }).map((_, i) => {
        const h = held[i];
        const card = h?.card;
        const flipped = flippedCount > i;
        const settled = reversedSettled.includes(i);
        // Obrácená karta: po flipu drží líc chvíli vzpřímeně, pak se dotočí.
        const faceRotation = card?.reversed ? (settled ? 180 : 0) : 0;
        return (
          <div key={i} className="flex flex-col items-center gap-2">
            <AnimatePresence>
              {flipped && (
                <motion.span
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="min-h-8 text-center text-xs leading-tight text-accent-soft"
                >
                  {positions[i]}
                  {card?.reversed && settled ? " · obráceně" : ""}
                </motion.span>
              )}
            </AnimatePresence>
            <div
              className="relative aspect-[3/5] w-full max-w-28"
              style={{ perspective: "800px" }}
            >
              {card && (
                <motion.div
                  className="absolute inset-0 will-change-transform"
                  animate={{ rotateY: flipped ? 180 : 0 }}
                  transition={{
                    duration: reducedMotion ? 0.001 : 0.6,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
                    <CardBack className="h-full w-full drop-shadow-card" />
                  </div>
                  <div
                    className="absolute inset-0"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  >
                    <motion.div
                      className="h-full w-full"
                      animate={{ rotate: faceRotation }}
                      transition={{ duration: reducedMotion ? 0.001 : 0.45, ease: "easeInOut" }}
                    >
                      <CardFace
                        card={
                          CARD_BY_ID[card.cardId] ?? {
                            id: card.cardId,
                            name: card.name,
                            arcana: "major",
                            symbol: card.symbol ?? symbolFor(card.name),
                          }
                        }
                        className="h-full w-full drop-shadow-card"
                      />
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
