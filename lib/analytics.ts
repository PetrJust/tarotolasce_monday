"use client";
// Analytické události (v1.5 §7). MOCK: posílá na /api/analytics, který je
// v mocku jen zaloguje/uloží. Zároveň přeposílá do pixelů (Meta/TikTok) -
// consent gating řeší lib/pixels.ts (bez „Přijmout vše" žádný požadavek).
import { trackPixelEvent } from "./pixels";

// Typ výkladu pro analytiku (v1.5 §7: funnel per typ 1/3/6)
export function readingType(spread: string): "1" | "3" | "6" | "daily" {
  if (spread === "yesno") return "1";
  if (spread === "my_ex") return "6";
  if (spread === "daily") return "daily";
  return "3";
}

export function logEvent(name: string, data: Record<string, unknown> = {}) {
  trackPixelEvent(name, data);
  try {
    const body = JSON.stringify({ name, data, ts: Date.now() });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics", body);
    } else {
      fetch("/api/analytics", { method: "POST", body, keepalive: true }).catch(() => {});
    }
  } catch {
    /* analytika nesmí nikdy rozbít UX */
  }
}
