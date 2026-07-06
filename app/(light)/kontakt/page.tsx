// Kontakt (v1 §12): web slibuje „napiš nám a 29 Kč ti vrátíme" - tady je kam.
// Zákonná náležitost + kanál pro refund proces.
import type { Metadata } from "next";
import { CONTACT_EMAIL, OPERATOR, OPERATOR_ICO, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Napiš nám. Vrácení peněz, dotazy k výkladům i technické potíže řešíme e-mailem.",
  alternates: { canonical: `${SITE_URL}/kontakt` },
};

export default function KontaktPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-[42px] leading-[1.1] font-semibold text-body">Kontakt</h1>
      <p className="mt-4 max-w-xl text-body-dim">
        Nejrychleji nás zastihneš e-mailem. Odpovídáme obvykle do jednoho
        pracovního dne.
      </p>
      <div className="mt-6 rounded-2xl border border-surface bg-surface p-6">
        <p className="text-sm text-body-dim">E-mail</p>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="mt-1 block font-display text-2xl font-semibold text-accent-soft"
        >
          {CONTACT_EMAIL}
        </a>
      </div>
      <div className="mt-6 space-y-3 text-sm text-body-dim">
        <p>
          <strong className="text-body">Vrácení peněz:</strong> pokud ti
          první výklad nic nedal, napiš nám z adresy, kterou jsi použila při
          nákupu, a 29 Kč ti vrátíme. Bez dotazů.
        </p>
        <p>
          <strong className="text-body">Provozovatel:</strong> {OPERATOR}
          {OPERATOR_ICO ? `, IČO: ${OPERATOR_ICO}` : ""}
        </p>
      </div>
    </main>
  );
}
