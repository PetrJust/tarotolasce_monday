"use client";
// Přihlášený stav z httpOnly session (v1.1 §B) - jediný zdroj pravdy pro
// nav i stránky. Fix F.3/H.1: po přihlášení nikdy „Přihlásit se".
import { useEffect, useState } from "react";

export function useSession() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => setEmail(d.email ?? null))
      .finally(() => setLoading(false));
  }, []);
  async function logout() {
    await fetch("/api/auth/session", { method: "DELETE" });
    setEmail(null);
  }
  return { email, loading, logout };
}
