"use client";
// Vstupní pole otázky na landing page. Odesílá do /vyklad/novy?q=
import { useState } from "react";
import { useRouter } from "next/navigation";

import { QUESTION_CHIPS } from "@/lib/chips";

export default function QuestionBox() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function go(question: string) {
    if (!question.trim()) return;
    router.push(`/vyklad/novy?q=${encodeURIComponent(question.trim())}`);
  }

  return (
    <div>
      <textarea
        value={q}
        onChange={(e) => setQ(e.target.value)}
        rows={2}
        placeholder="Napiš otázku vlastními slovy…"
        aria-label="Napiš otázku vlastními slovy"
        className="w-full rounded-2xl border border-surface bg-surface p-5 text-lg text-body placeholder:text-body-dim/70 focus:border-accent"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {QUESTION_CHIPS.map((s) => (
          <button
            key={s}
            onClick={() => go(s)}
            className="rounded-full border border-surface px-4 py-2 text-sm text-body-dim hover:border-accent-dim hover:text-body"
          >
            {s}
          </button>
        ))}
      </div>
      <button
        onClick={() => go(q)}
        disabled={!q.trim()}
        className="btn-primary mt-5 w-full"
      >
        Vyložit karty
      </button>
      {/* v1.6 §7.1: pod CTA DOSLOVA */}
      <p className="mt-3 text-center text-sm text-body-dim">
        Výklady vytváří Nomi, AI kartářka.
      </p>
    </div>
  );
}
