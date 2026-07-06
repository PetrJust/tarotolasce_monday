// OTP request (v1.1 §B.2 + v1.3 §5). Identická odpověď pro existující
// i neexistující e-mail; limity řeší lib/account. Kód jde výhradně do
// e-mailu. Testovací režim (preview, lokálně, nebo produkce s vědomě
// nastaveným ALLOW_DEV_TOOLS=1): TEST_OTP_CODE přebije vygenerovaný kód
// a vrací se klientovi pro banner „Testovací režim: kód je …";
// OTP_DEV_PREVIEW vrací devCode pro /dev/kredit rychlé přihlášení.
import { NextResponse } from "next/server";
import { requestOtp, overrideOtpCode } from "@/lib/account";
import { sendOtpEmail } from "@/lib/email";

const IS_PROD = process.env.VERCEL_ENV === "production";
// Stejný přepínač jako v app/dev/layout.tsx: na produkci normálně nic
// z tohohle nesmí být dostupné, ALE zakladatel to může vědomě odemknout
// (např. otestovat nákup kreditu přímo na produkční doméně). Bez tohohle
// by /dev/kredit sice bylo vidět, ale přihlášení by v něm nešlo dokončit.
const DEV_UNLOCKED = process.env.ALLOW_DEV_TOOLS === "1";
const ALLOW_TEST_MODE = !IS_PROD || DEV_UNLOCKED;

export async function POST(req: Request) {
  const { email, purpose } = await req.json().catch(() => ({}));
  if (typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ ok: true }); // žádný únik informace
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const res = await requestOtp(email, typeof purpose === "string" ? purpose : "login", ip);
  if (res.sent && res.code) {
    let code = res.code;
    const testCode = ALLOW_TEST_MODE ? process.env.TEST_OTP_CODE : undefined;
    if (testCode && /^\d{6}$/.test(testCode)) {
      await overrideOtpCode(email, typeof purpose === "string" ? purpose : "login", testCode);
      code = testCode;
    }
    await sendOtpEmail(email, code);
    const payload: Record<string, unknown> = { ok: true };
    if (testCode && /^\d{6}$/.test(testCode)) payload.testCode = code;
    if (process.env.OTP_DEV_PREVIEW === "1" && ALLOW_TEST_MODE) payload.devCode = code;
    return NextResponse.json(payload);
  }
  return NextResponse.json({ ok: true });
}
