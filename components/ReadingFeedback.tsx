"use client";
// Feedback po dočtení výkladu (v1.6 §7.11): BINÁRNÍ, párovaný na verzi
// promptu a modelu. Copy DOSLOVA: „Jak ti výklad sedl? [Sedl mi] [Spíš ne]"
// → „Děkujeme. Pomáhá nám to výklady zlepšovat." Žádné komentářové pole.
import { logEvent, readingType } from "@/lib/analytics";
import { PROMPT_VERSION, MODEL_VERSION } from "@/lib/version";
import { useState } from "react";

export default function ReadingFeedback({
  readingId,
  spread,
}: {
  readingId: string;
  spread?: string;
}) {
  const [sent, setSent] = useState(false);

  async function send(r: "up" | "down") {
    logEvent("feedback_submitted", {
      rating: r,
      promptVersion: PROMPT_VERSION,
      modelVersion: MODEL_VERSION,
      type: spread ? readingType(spread) : undefined,
    });
    setSent(true);
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ readingId, rating: r }),
    }).catch(() => {});
  }

  if (!readingId) return null;

  if (sent) {
    return (
      <div className="mt-10 rounded-2xl border border-surface bg-surface p-5 text-center">
        <p className="text-body-dim">Děkujeme. Pomáhá nám to výklady zlepšovat.</p>
      </div>
    );
  }

  return (
    <div className="mt-10 rounded-2xl border border-surface bg-surface p-5">
      <p className="text-center font-display text-xl text-body">Jak ti výklad sedl?</p>
      <div className="mt-4 flex justify-center gap-3">
        <button
          onClick={() => send("up")}
          className="rounded-xl border border-surface px-5 py-2.5 text-sm text-body-dim transition-colors hover:text-body"
        >
          Sedl mi
        </button>
        <button
          onClick={() => send("down")}
          className="rounded-xl border border-surface px-5 py-2.5 text-sm text-body-dim transition-colors hover:text-body"
        >
          Spíš ne
        </button>
      </div>
    </div>
  );
}
