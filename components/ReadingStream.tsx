"use client";
// Výklad se streamuje po slovech pod rozloženými kartami.
// Loading text doslovně: „Nomi čte tvoje karty"
import { useEffect, useRef, useState } from "react";
import type { PickedCard } from "./Ritual";

export default function ReadingStream({
  sessionId,
  question,
  spread,
  cards,
  useCredit = false,
  onMeta,
  onDone,
  onError,
}: {
  sessionId: string;
  question: string;
  spread: string;
  cards: PickedCard[];
  /** Čerpat výklad z balíčku (server si strhne kredit; idempotentní na sessionId). */
  useCredit?: boolean;
  onMeta?: (readingId: string) => void;
  onDone?: (fullText: string) => void;
  onError?: () => void;
}) {
  const [text, setText] = useState("");
  const [started, setStarted] = useState(false);
  const [doneLocal, setDoneLocal] = useState(false);
  const ran = useRef(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  // Auto-scroll sleduje text, ale ruční scroll uživatelky má vždy přednost.
  const userScrolledRef = useRef(false);

  useEffect(() => {
    function onWheelOrTouch() {
      const nearBottom =
        window.innerHeight + window.scrollY >=
        document.body.scrollHeight - 120;
      // Když je uživatelka u spodního okraje, auto-scroll smí pokračovat;
      // jakmile odscrolluje nahoru, přebírá kontrolu a my couváme.
      userScrolledRef.current = !nearBottom;
    }
    window.addEventListener("wheel", onWheelOrTouch, { passive: true });
    window.addEventListener("touchmove", onWheelOrTouch, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheelOrTouch);
      window.removeEventListener("touchmove", onWheelOrTouch);
    };
  }, []);

  useEffect(() => {
    if (!userScrolledRef.current && started) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [text, started]);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      try {
        const res = await fetch("/api/reading/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, question, spread, cards, useCredit }),
        });
        if (!res.ok || !res.body) throw new Error("stream failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let full = "";
        let finished = false;

        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";
          for (const evt of events) {
            const isMeta = evt.includes("event: meta");
            const isDone = evt.includes("event: done");
            const dataLine = evt.split("\n").find((l) => l.startsWith("data: "));
            if (!dataLine) continue;
            const data = JSON.parse(dataLine.slice(6));
            if (isMeta && data.readingId) onMeta?.(data.readingId);
            else if (isDone) {
              setDoneLocal(true); // v1.1 H.3: kurzor pryč okamžitě po done
              if (!finished) {
                finished = true;
                onDone?.(full);
              }
            } else if (data.t) {
              full += data.t;
              setStarted(true);
              setText(full);
            }
          }
        }
        if (!finished) {
          finished = true;
          onDone?.(full);
        }
        setDoneLocal(true); // 6.3: kurzor po dokončení zmizí
      } catch {
        onError?.();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!started) {
    return (
      <div className="flex items-center justify-center gap-3 py-12 text-body-dim">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-rose-500" />
        <span className="font-display text-xl">Tvůj výklad se právě píše</span>
      </div>
    );
  }

  return (
    <div className="prose-tarot mx-auto max-w-xl whitespace-pre-line py-8 text-lg leading-relaxed text-body">
      {text}
      {!doneLocal && (
        <span className="ml-0.5 inline-block h-5 w-0.5 animate-pulse bg-rose-500 align-middle" />
      )}
      <div ref={endRef} />
    </div>
  );
}
