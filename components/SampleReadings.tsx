"use client";
// Ukázkové výklady na landing page: 1 rozbalená + 2 sbalené (v1.1 F.4).
// Texty DOSLOVA dle v1.3 §3.4 - finální znění schválené zakladatelem
// (nahrazuje G.3; golden set se proti nim přeměřuje).
import { useState } from "react";

type Sample = {
  question: string;
  text: string;
};

const SAMPLES: Sample[] = [
  {
    question: "Myslí na mě ještě?",
    text: "Dvojka pohárů říká, že mezi vámi něco zůstalo — ale odpověď není jen v tom, jestli se ozve. Důležité je i to, co ti to čekání bere.",
  },
  {
    question: "Mám mu napsat?",
    text: "Spíš ne hned. Rytíř mečů radí nejdřív klid, ne další nejistotu.",
  },
  {
    question: "Co mě na něm pořád drží?",
    text: "Kolo štěstí ukazuje: možná nečekáš na něj, ale na pocit, který jsi s ním kdysi měla.",
  },
];

function firstSentence(t: string): string {
  const m = t.match(/^[^.!?]*[.!?]/);
  return (m ? m[0] : t).trim();
}

export default function SampleReadings() {
  // První ukázka rozbalená, další dvě sbalené (F.4 + v1.3 §3.4)
  const [open, setOpen] = useState<boolean[]>([true, false, false]);

  return (
    <div className="mt-6 space-y-4">
      {SAMPLES.map((s, i) => {
        const expanded = open[i];
        return (
          <article
            key={s.question}
            className="rounded-2xl border border-surface bg-surface p-5"
          >
            <h3 className="font-display text-xl font-semibold text-body">
              „{s.question}"
            </h3>
            {expanded ? (
              <p className="mt-2 text-sm leading-relaxed text-body-dim">
                {s.text}
              </p>
            ) : (
              <>
                <p className="mt-2 text-sm leading-relaxed text-body-dim">
                  {firstSentence(s.text)}
                </p>
                <button
                  onClick={() =>
                    setOpen((o) => o.map((v, j) => (j === i ? true : v)))
                  }
                  className="mt-2 text-sm text-accent-soft underline underline-offset-2 hover:text-accent"
                >
                  zobrazit víc
                </button>
              </>
            )}
          </article>
        );
      })}
    </div>
  );
}
