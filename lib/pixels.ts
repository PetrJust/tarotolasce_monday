// Pixely (v1.5 §7): Meta Pixel + TikTok Pixel s TVRDÝM consent gatingem.
// Načtení a střelba VÝHRADNĚ po volbě „Přijmout vše" (tol_consent=all);
// po „Jen nezbytné" se nenačte vůbec nic - akceptační test: network log
// před souhlasem neobsahuje žádný požadavek na facebook.com/tr,
// connect.facebook.net ani analytics.tiktok.com.
// Conversions API (server-side): posílá se JEN se souhlasem - v mocku
// neimplementováno (vyžaduje META_CAPI_TOKEN; viz komentář dole).
// ID pixelů přes env - bez nich je všechno no-op:
//   NEXT_PUBLIC_META_PIXEL_ID, NEXT_PUBLIC_TIKTOK_PIXEL_ID
import { getCookie } from "./clientState";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    ttq?: { load: (id: string) => void; page: () => void; track: (e: string, p?: Record<string, unknown>) => void };
  }
}

export function hasFullConsent(): boolean {
  if (typeof document === "undefined") return false;
  return getCookie("tol_consent") === "all";
}

let loaded = false;

/** Zavolej PO udělení plného souhlasu (a při načtení stránky, pokud už
 * souhlas existuje). Bez souhlasu je to no-op - nic se nestáhne. */
export function loadPixelsIfConsented() {
  if (loaded || typeof window === "undefined" || !hasFullConsent()) return;
  const metaId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const ttId = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
  if (!metaId && !ttId) return;
  loaded = true;

  if (metaId) {
    // Standardní Meta Pixel bootstrap
    const w = window as unknown as Record<string, unknown>;
    if (!w.fbq) {
      const fbq: ((...a: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string; callMethod?: unknown; push?: unknown } =
        function (...args: unknown[]) {
          (fbq.queue as unknown[]).push(args);
        };
      fbq.queue = [];
      fbq.loaded = true;
      fbq.version = "2.0";
      fbq.push = fbq;
      w.fbq = fbq;
      w._fbq = fbq;
      const s = document.createElement("script");
      s.async = true;
      s.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(s);
    }
    window.fbq?.("init", metaId);
    window.fbq?.("track", "PageView");
  }

  if (ttId) {
    // Standardní TikTok Pixel bootstrap (zjednodušený)
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${ttId}&lib=ttq`;
    s.onload = () => {
      window.ttq?.page();
    };
    document.head.appendChild(s);
  }
}

/** Přepošle event do pixelů - jen se souhlasem a po načtení. */
export function trackPixelEvent(name: string, props: Record<string, unknown> = {}) {
  if (!hasFullConsent()) return;
  const map: Record<string, { meta?: string; tiktok?: string }> = {
    view_pricing: { meta: "ViewContent", tiktok: "ViewContent" },
    checkout_start: { meta: "InitiateCheckout", tiktok: "InitiateCheckout" },
    purchase: { meta: "Purchase", tiktok: "CompletePayment" },
    reading_completed: { meta: "CompleteRegistration" },
    daily_card_optin: { meta: "Lead", tiktok: "SubmitForm" },
  };
  const m = map[name];
  if (!m) return;
  if (m.meta) window.fbq?.("track", m.meta, props);
  if (m.tiktok) window.ttq?.track(m.tiktok, props);
}

// CAPI (Meta Conversions API) - PRODUKČNÍ TODO, mimo mock:
// server-side POST na graph.facebook.com s META_CAPI_TOKEN, deduplikace
// přes event_id, a POSÍLÁ SE JEN když request nese důkaz souhlasu
// (tol_consent=all cookie) - tvrdá podmínka v1.5 §7.
