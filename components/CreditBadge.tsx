"use client";
// Zůstatek kreditu ze serverového ledgeru (v1.1 §A) - vázaný na účet,
// ne na zařízení. Bez přihlášení nebo při nule se neukazuje.
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCreditsEnabled } from "@/lib/flags";
import { vykladu } from "@/lib/declension";

export default function CreditBadge() {
  const enabled = useCreditsEnabled();
  const [balance, setBalance] = useState(0);
  useEffect(() => {
    fetch("/api/credits").then((r) => r.json()).then((d) => setBalance(d.balance ?? 0)).catch(() => {});
  }, []);
  if (!enabled || balance <= 0) return null;
  return (
    <Link
      href="/cenik"
      className="rounded-full border border-accent-dim px-2.5 py-1 text-[11px] text-accent-soft"
      title="Zbývající výklady z balíčku"
    >
      {vykladu(balance)}
    </Link>
  );
}
