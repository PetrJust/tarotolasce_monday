// Diagnostika pro /dev/kredit (v1.3 §5 hotfix): ukazuje, co server PRÁVĚ
// TEĎ vidí za env proměnné - žádné tajné hodnoty, jen booleany/název
// prostředí. Cíl: rozlišit "proměnná není nastavená" od "proměnná je
// nastavená, ale ještě neproběhl redeploy" bez dohadování nad Vercel
// dashboardem. Dostupné jen tam, kde je dostupné i /dev/* samo (stejná
// logika jako app/dev/layout.tsx).
import { NextResponse } from "next/server";
import { withApiGuard } from "@/lib/apiGuard";

async function handleGET() {
  const vercelEnv = process.env.VERCEL_ENV ?? null;
  const isProd = vercelEnv === "production";
  const allowDevTools = process.env.ALLOW_DEV_TOOLS === "1";
  // Stejná podmínka jako app/dev/layout.tsx - ať se tenhle endpoint chová
  // konzistentně s viditelností /dev/* stránek samotných.
  if (isProd && !allowDevTools) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const otpDevPreview = process.env.OTP_DEV_PREVIEW === "1";
  const hasTestOtpCode = !!process.env.TEST_OTP_CODE;
  return NextResponse.json({
    vercelEnv,
    isProd,
    allowDevTools,
    otpDevPreview,
    hasTestOtpCode,
    // Tohle přesně řídí, jestli quickLogin() na /dev/kredit dostane kód
    // (buď přes OTP_DEV_PREVIEW jako devCode, nebo přes TEST_OTP_CODE
    // jako testCode - klient teď umí použít oba).
    devLoginAvailable: (!isProd || allowDevTools) && (otpDevPreview || hasTestOtpCode),
  });
}
export const GET = withApiGuard(handleGET);
