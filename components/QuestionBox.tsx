"use client";
// Vstupní pole otázky na landing page. Odesílá do /vyklad/novy?q=
import { useState } from "react";
import { useRouter } from "next/navigation";

const SUGGESTIONS = ["Miluje mě?", "Mám mu odpustit?", "Přijde někdo nový?"];

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
        placeholder="Na co se chceš zeptat?"
        aria-label="Na co se chceš zeptat?"
        className="w-full rounded-2xl border border-surface bg-surface p-5 text-lg text-body placeholder:text-body-dim/70 focus:border-accent"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
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
        className="mt-5 w-full rounded-xl bg-love px-6 py-4 text-lg font-semibold text-night-deep shadow-glow transition hover:opacity-90 disabled:opacity-60 disabled:saturate-[.35]"
      >
        Vyložit karty
      </button>
    </div>
  );
}
