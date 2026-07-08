"use client";
// Analytické události (v1 §13). MOCK: posílá na /api/analytics, který je
// v mocku jen zaloguje/uloží. V produkci se napojí na reálný nástroj.
export function logEvent(name: string, data: Record<string, unknown> = {}) {
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
