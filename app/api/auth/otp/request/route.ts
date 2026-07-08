// OTP request (v1.1 §B.2). Identická odpověď pro existující i neexistující
// e-mail; limity řeší lib/account. Kód jde výhradně do e-mailu; dev náhled
// jen za env podmínkou (v produkci nesmí existovat - H.5).
import { NextResponse } from "next/server";
import { requestOtp } from "@/lib/account";
import { sendOtpEmail } from "@/lib/email";

export async function POST(req: Request) {
  const { email, purpose } = await req.json().catch(() => ({}));
  if (typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ ok: true }); // žádný únik informace
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const res = await requestOtp(email, typeof purpose === "string" ? purpose : "login", ip);
  if (res.sent && res.code) {
    await sendOtpEmail(email, res.code);
    const devPreview =
      process.env.OTP_DEV_PREVIEW === "1" && process.env.NODE_ENV !== "production";
    if (devPreview) return NextResponse.json({ ok: true, devCode: res.code });
  }
  return NextResponse.json({ ok: true });
}
