"use client";
// Rituál výběru karet (follow-up prompt 1). Rituál JE produkt.
// Fáze 0 vějíř (oblouk) → 1 míchání (reálné, server re-shuffle) → 2 výběr
// (zvednutí, držená řada, krok zpět) → 3 reveal (sekvenční 3D flip, obrácení
// má vlastní moment) → předání nahoru pro streaming výkladu.
// Animace jen přes transform a opacity. prefers-reduced-motion: rozlet a flip
// nahrazeny crossfady, struktura a časování zůstávají.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

  // --- Geometrie oblouku ---
  // Karty leží na oblouku; rotace je tangenciální. Posun vějíře = úhlový offset.
  const [offset, setOffset] = useState(0); // v "krocích karet"
  const offsetRef = useRef(0);
  const velocityRef = useRef(0);
  const draggingRef = useRef(false);
  const lastXRef = useRef(0);
  const lastTRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [vw, setVw] = useState(390);

  useEffect(() => {
    const update = () => setVw(viewportRef.current?.clientWidth ?? window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Responzivní geometrie vějíře, ať na mobilu nepřesahuje okraje.
  // Na úzkém displeji jsou karty i krok menší.
  const cardW = vw < 360 ? 44 : vw < 480 ? 52 : 64;
  const cardH = Math.round(cardW * 2.5);
  const halfW = cardW / 2;
  // krok = překryv karet; menší displej => menší krok (víc překryvu)
  const step = Math.max(16, Math.round(cardW * 0.42));
  const radius = vw * 1.4;
  // širší okno než jen viditelná část: i po několika výběrech zůstane
  // dost nevybraných karet v DOM, aby šlo vybrat i poslední (6.) kartu
  const visibleCount = Math.min(DECK_SIZE, Math.ceil(vw / step) + 16);

  const setOffsetClamped = useCallback(
    (v: number) => {
      const max = 0;
      const min = -(DECK_SIZE - 1) * step;
      const clamped = Math.max(min, Math.min(max, v));
      offsetRef.current = clamped;
      setOffset(clamped);
    },
    [step]
  );

  // Momentum scrolling
  const startMomentum = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const tick = () => {
      if (draggingRef.current) return;
      velocityRef.current *= 0.94;
      if (Math.abs(velocityRef.current) < 0.1) {
        velocityRef.current = 0;
        return;
      }
      setOffsetClamped(offsetRef.current + velocityRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [setOffsetClamped]);

  function onPointerDown(e: React.PointerEvent) {
    if (phase !== "picking") return;
    draggingRef.current = true;
    lastXRef.current = e.clientX;
    lastTRef.current = performance.now();
    velocityRef.current = 0;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!draggingRef.current) return;
    const now = performance.now();
    const dx = e.clientX - lastXRef.current;
    const dt = Math.max(1, now - lastTRef.current);
    velocityRef.current = dx / dt * 16; // px za snímek
    lastXRef.current = e.clientX;
    lastTRef.current = now;
    setOffsetClamped(offsetRef.current + dx);
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
    // vstup do výběru: vějíř vystředíme na střed balíčku (jinak míří mimo okraj)
    setFocusedIndex(Math.floor(DECK_SIZE / 2));
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
      if (navigator.vibrate) navigator.vibrate(10);
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

  // --- Klávesnice: šipky pohyb, Enter výběr ---
  function onKeyDown(e: React.KeyboardEvent) {
    if (phase !== "picking") return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setFocusedIndex((i) => Math.min(DECK_SIZE - 1, i + 1));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setFocusedIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick(focusedIndex);
    }
  }

  // Drž fokusovanou kartu ve viditelné části vějíře
  useEffect(() => {
    if (phase !== "picking") return;
    const cardCenter = -focusedIndex * step;
    const target = vw / 2 - halfW + cardCenter;
    setOffsetClamped(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedIndex, phase]);

  const fanFull = held.length >= cardCount;

  // Které karty vykreslit (virtualizace ~30 v DOM)
  const centerIdx = Math.round((-offset + vw / 2 - halfW) / step);
  const lo = Math.max(0, centerIdx - Math.ceil(visibleCount / 2));
  const hi = Math.min(DECK_SIZE, centerIdx + Math.ceil(visibleCount / 2));

  return (
    <div className="flex min-h-[78dvh] flex-col gap-2">
      {/* ---------- HORNÍ OBLAST ---------- */}
      <div className={phase === "picking" ? "flex-none" : "flex-1"}>
        {phase === "intro" && (
          <div className="flex h-full flex-col items-center justify-center gap-8 py-16 text-center">
            <p className="font-display text-3xl font-semibold text-body">
              Soustřeď se na svou otázku. Nomi zamíchá karty.
            </p>
            <button
              onClick={() => doShuffle(true)}
              className="rounded-xl bg-gold px-8 py-4 text-lg font-medium text-night shadow-glow hover:bg-gold-soft"
            >
              Zamíchat karty
            </button>
            <button
              onClick={() => setSoundOn((s) => !s)}
              aria-pressed={soundOn}
              className="text-sm text-body-dim hover:text-body"
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
            <p className="text-body-dim">Nomi míchá tvoje karty…</p>
          </div>
        )}

        {(phase === "picking" || phase === "revealing" || phase === "done") && (
          <div className="py-4">
            {phase === "picking" && (
              <div className="mb-4 text-center">
                <p className="font-display text-2xl font-semibold text-body">
                  {vyberKaret(cardCount)}
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
                  className="rounded-xl bg-gold px-8 py-4 text-lg font-medium text-night shadow-glow hover:bg-gold-soft"
                >
                  Otočit karty
                </motion.button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---------- VĚJÍŘ (oblouk) ---------- */}
      {phase === "picking" && (
        <div className="flex flex-1 flex-col justify-end">
          <div
            ref={viewportRef}
            className="relative h-52 touch-none select-none overflow-hidden"
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
              filter: fanFull && !reducedMotion ? "brightness(0.5) blur(1px)" : undefined,
              transition: "filter 0.4s",
            }}
          >
          {Array.from({ length: hi - lo }).map((_, k) => {
            const i = lo + k;
            const isHeld = held.some((h) => h.index === i);
            // pozice na oblouku
            const x = offset + i * step;
            const center = vw / 2 - halfW;
            const dxFromCenter = x - center;
            const t = dxFromCenter / radius; // úhel (rad, malý)
            const lift = Math.cos(t) * 18; // karty u kraje níž
            const rot = (t * 180) / Math.PI * 0.6; // tangenciální natočení
            const focused = i === focusedIndex;
            return (
              <motion.button
                key={i}
                id={`fan-card-${i}`}
                role="option"
                aria-selected={isHeld}
                aria-label={`Karta ${i + 1} z 78, rubem nahoru`}
                disabled={isHeld || fanFull || busyIndex !== null}
                onClick={() => pick(i)}
                onFocus={() => setFocusedIndex(i)}
                className="absolute bottom-2 origin-bottom will-change-transform disabled:pointer-events-none"
                style={{
                  left: x,
                  width: cardW,
                  height: cardH,
                  transform: `translateY(${-lift}px) rotate(${rot}deg)`,
                  zIndex: focused ? 100 : i,
                  opacity: isHeld ? 0 : 1,
                }}
                animate={
                  focused && !reducedMotion
                    ? { y: -12, scale: 1.05 }
                    : { y: 0, scale: 1 }
                }
                transition={{ duration: 0.18 }}
              >
                <CardBack
                  className={`h-full w-full drop-shadow-card ${
                    focused ? "rounded-xl ring-2 ring-gold" : ""
                  }`}
                />
              </motion.button>
            );
          })}

          {/* Tichý hint, dokud uživatelka nevybere první kartu */}
          {!fanFull && held.length === 0 && (
            <span className="pointer-events-none absolute inset-x-0 bottom-1 z-[60] text-center text-xs text-body-dim/80">
              Klepni na kartu, nebo táhni pro výběr
            </span>
          )}
          </div>

          {/* Zamíchat znovu: decentní odkaz pod vějířem (nekonkuruje hlavní akci) */}
          <div className="mt-2 flex justify-center">
            <button
              onClick={() => doShuffle(false)}
              disabled={held.length > 0}
              className="text-[13px] text-body-dim underline decoration-night-line underline-offset-4 hover:text-body disabled:no-underline disabled:opacity-35"
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
