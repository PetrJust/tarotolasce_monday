"use client";
// Nákup balíčku (v1.1 §A): funkční přes serverový ledger. Kredit patří
// účtu, proto nákup vyžaduje přihlášení; bez něj vedeme na /prihlaseni.
// Připsání je idempotentní (webhook ref), zůstatek = SUM z ledgeru.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCreditsEnabled } from "@/lib/flags";
import { useSession } from "@/lib/useSession";
import { vykladu } from "@/lib/declension";

export default function BuyPack({
  priceId,
  credits,
}: {
  priceId: string | null;
  credits: number;
}) {
  const creditsEnabled = useCreditsEnabled();
  const { email, loading } = useSession();
  const router = useRouter();
  const [state, setState] = useState<"idle" | "paying" | "done" | "failed">("idle");
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    fetch("/api/credits").then((r) => r.json()).then((d) => setBalance(d.balance ?? 0)).catch(() => {});
  }, [state]);

  if (!priceId) {
    // Ceník: primární akce obrazovky = „Položit otázku" (mapa C)
    return (
      <Link
        href="/vyklad/novy"
        className="mt-5 block rounded-xl bg-love px-5 py-3 text-center text-plum-900 hover:opacity-90"
      >
        Položit otázku
      </Link>
    );
  }

  async function buy() {
    if (!email) {
      router.push("/prihlaseni");
      return;
    }
    setState("paying");
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId }),
    });
    if (!res.ok) {
      setState(res.status === 401 ? "idle" : "failed");
      if (res.status === 401) router.push("/prihlaseni");
      return;
    }
    const data = await res.json();
    setBalance(data.balance ?? 0);
    setState("done");
  }

  return (
    <div className="mt-5">
      <button
        onClick={buy}
        disabled={!creditsEnabled || state === "paying" || loading}
        className="w-full rounded-xl bg-love px-5 py-3 text-plum-900 hover:opacity-90 disabled:opacity-60 disabled:saturate-[.35]"
      >
        {!creditsEnabled
          ? "Brzy"
          : state === "paying"
          ? "Zpracovává se…"
          : email
          ? "Koupit balíček"
          : "Přihlásit se a koupit"}
      </button>
      {!creditsEnabled && (
        <p className="mt-2 text-center text-xs text-body-dim">
          Balíčky spouštíme už brzy. Jednotlivé výklady fungují už teď.
        </p>
      )}
      {state === "done" && (
        <p className="mt-2 text-center text-xs text-accent-soft">
          Hotovo, {vykladu(balance)}.
        </p>
      )}
      {state === "failed" && (
        <p className="mt-2 text-center text-xs text-body-dim">
          Platba neproběhla. Nic jsme ti nestrhli, zkus to znovu.
        </p>
      )}
    </div>
  );
}
