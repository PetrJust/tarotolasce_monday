"use client";
// Pomocné cookie helpery. Citlivá data (otázky, výklady) zůstávají na serveru;
// v cookies je jen e-mail pro mock přihlášení a počítadla nákupů/kreditů.
export function getCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export function setCookie(name: string, value: string, days = 365) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${days * 86400}`;
}

export function getCredits(): number {
  return parseInt(getCookie("tol_credits") ?? "0", 10) || 0;
}
export function setCredits(n: number) {
  setCookie("tol_credits", String(Math.max(0, n)));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("tol-credits"));
  }
}
export function getSinglePurchases(): number {
  return parseInt(getCookie("tol_singles") ?? "0", 10) || 0;
}
export function bumpSinglePurchases() {
  setCookie("tol_singles", String(getSinglePurchases() + 1));
}
export function getFirstDone(): boolean {
  return getCookie("tol_first_done") === "1";
}
export function setFirstDone() {
  setCookie("tol_first_done", "1");
}
export function getEmail(): string | null {
  return getCookie("tol_email");
}
export function setEmail(email: string) {
  setCookie("tol_email", email);
}
export function clearEmail() {
  document.cookie = "tol_email=; path=/; max-age=0";
}

/* --- Cesta k průvodkyni: počítadla výkladů a dárek --- */
// Počet dokončených placených výkladů celkem (pro odměnu po 10.)
export function getReadingCount(): number {
  return parseInt(getCookie("tol_reads") ?? "0", 10) || 0;
}
// Kolik výkladů proběhlo dnes (pro jemnou brzdu, ne prodej)
export function getTodayReads(): number {
  const raw = getCookie("tol_reads_day") ?? "";
  const [day, count] = raw.split(":");
  const today = new Date().toISOString().slice(0, 10);
  return day === today ? parseInt(count, 10) || 0 : 0;
}
export function bumpReadingCount() {
  setCookie("tol_reads", String(getReadingCount() + 1));
  const today = new Date().toISOString().slice(0, 10);
  setCookie("tol_reads_day", `${today}:${getTodayReads() + 1}`);
}
// Dárek: 10 minut s průvodkyní na Spiriu po 10. výkladu (jednorázově)
export function isGuideGiftUsed(): boolean {
  return getCookie("tol_gift_guide") === "1";
}
export function setGuideGiftUsed() {
  setCookie("tol_gift_guide", "1");
}
