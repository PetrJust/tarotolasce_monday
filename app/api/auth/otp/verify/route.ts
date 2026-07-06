// OTP verify (v1.1 §B.2): hash, TTL 10 min, jednorázovost, 5 pokusů ->
// zámek 15 min. Úspěch = httpOnly session (bezstavový podepsaný token,
// viz lib/account.ts). TESTOVACÍ REŽIM (hotfix serverless): když je
// aktivní TEST_OTP_CODE a kód sedí, ověří se BEZ úložiště - dřív ověření
// hledalo OTP záznam v /tmp, který na jiné serverless instanci
// neexistoval, takže kód 123456 náhodně „neseděl".
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOtp, signSessionToken } from "@/lib/account";
import { withApiGuard } from "@/lib/apiGuard";

const IS_PROD = process.env.VERCEL_ENV === "production";
const DEV_UNLOCKED = process.env.ALLOW_DEV_TOOLS === "1";
const ALLOW_TEST_MODE = !IS_PROD || DEV_UNLOCKED;

function setSessionCookie(token: string) {
  cookies().set("tol_session", token, {
    httpOnly: true, sameSite: "lax", path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 86400,
  });
}

async function handlePOST(req: Request) {
  const { email, code, purpose } = await req.json().catch(() => ({}));
  if (typeof email !== "string" || typeof code !== "string") {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  const p = typeof purpose === "string" ? purpose : "login";

  // Testovací režim: pevný kód ověří KAŽDÁ instance bez úložiště
  const testCode = ALLOW_TEST_MODE ? process.env.TEST_OTP_CODE : undefined;
  if (testCode && /^\d{6}$/.test(testCode) && code === testCode) {
    if (p === "login") setSessionCookie(signSessionToken(email));
    return NextResponse.json({ ok: true });
  }

  const res = await verifyOtp(email, p, code, p === "login");
  if (!res.ok) return NextResponse.json(res, { status: 401 });
  if (res.sessionToken) setSessionCookie(res.sessionToken);
  return NextResponse.json({ ok: true });
}

export const POST = withApiGuard(handlePOST);
