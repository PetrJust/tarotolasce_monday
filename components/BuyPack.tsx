"use client";
// Nákup balíčku (v1.1 §A): funkční přes serverový ledger. Kredit patří
// účtu, proto nákup vyžaduje přihlášení; bez něj vedeme na /prihlaseni.
// Připsání je idempotentní (webhook ref), zůstatek = SUM z ledgeru.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/useSession";
import { vykladu } from "@/lib/declension";

export default function BuyPack({
  priceId,
  credits,
  primary = false,
}: {
  priceId: string | null;
  credits: number;
  /** Právě jedna primární akce na obrazovku (invariant 3): na ceníku je
   * to vstupní karta „První výklad", ostatní tlačítka jsou sekundární. */
  primary?: boolean;
}) {
  const { email, loading } = useSession();
  const router = useRouter();
  const [state, setState] = useState<"idle" | "paying" | "done" | "failed">("idle");
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    fetch("/api/credits").then((r) => r.json()).then((d) => setBalance(d.balance ?? 0)).catch(() => {});
  }, [state]);

  const secondaryCls =
    "mt-0 flex w-full items-center justify-center rounded-[22px] border-2 border-rose-500 px-6 py-3 font-bold text-accent-soft hover:border-accent hover:text-accent";

  if (!priceId) {
    return (
      <Link
        href="/vyklad/novy"
        className={primary ? "btn-primary mt-5 w-full" : `${secondaryCls} mt-5`}
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
      {/* v1.3 §4: žádný mezistav „Brzy" - balíčky jsou zapojené spolu
          s ledgerem (na preview přes Stripe test mode). */}
      <button
        onClick={buy}
        disabled={state === "paying" || loading}
        className={primary ? "btn-primary w-full" : `${secondaryCls} disabled:opacity-50`}
      >
        {state === "paying"
          ? "Zpracovává se…"
          : email
          ? "Koupit balíček"
          : "Přihlásit se a koupit"}
      </button>
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
