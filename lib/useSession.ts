"use client";
// Přihlášený stav z httpOnly session (v1.1 §B) - jediný zdroj pravdy pro
// nav i stránky. Fix v1.3 §6.1 (čtvrté připomenutí): header žije v root
// layoutu a přežívá client-side navigace, takže jednorázový fetch po
// mountu po přihlášení zastaral a svítilo „Přihlásit se". Session se teď
// znovu načítá při změně cesty a po událostech přihlášení/odhlášení
// (event "tol-session-changed").
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export const SESSION_EVENT = "tol-session-changed";

/** Zavolej po úspěšném přihlášení/odhlášení mimo tento hook. */
export function announceSessionChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SESSION_EVENT));
  }
}

export function useSession() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const refresh = useCallback(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => setEmail(d.email ?? null))
      .catch(() => setEmail(null))
      .finally(() => setLoading(false));
  }, []);

  // Při mountu i každé změně cesty (login flow končí navigací)
  useEffect(() => {
    refresh();
  }, [refresh, pathname]);

  // Okamžitá reakce na přihlášení/odhlášení v témže view
  useEffect(() => {
    window.addEventListener(SESSION_EVENT, refresh);
    return () => window.removeEventListener(SESSION_EVENT, refresh);
  }, [refresh]);

  async function logout() {
    await fetch("/api/auth/session", { method: "DELETE" });
    setEmail(null);
    announceSessionChange();
  }
  return { email, loading, logout };
}
