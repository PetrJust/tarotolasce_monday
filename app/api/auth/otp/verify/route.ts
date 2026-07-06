// OTP verify (v1.1 §B.2): hash, TTL 10 min, jednorázovost, 5 pokusů ->
// zámek 15 min. Úspěch = email_verified_at + httpOnly session (login),
// u purpose daily_card_optin jen potvrzení opt-inu.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOtp } from "@/lib/account";

export async function POST(req: Request) {
  const { email, code, purpose } = await req.json().catch(() => ({}));
  if (typeof email !== "string" || typeof code !== "string") {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  const p = typeof purpose === "string" ? purpose : "login";
  const res = await verifyOtp(email, p, code, p === "login");
  if (!res.ok) return NextResponse.json(res, { status: 401 });
  if (res.sessionToken) {
    cookies().set("tol_session", res.sessionToken, {
      httpOnly: true, sameSite: "lax", path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 86400,
    });
  }
  return NextResponse.json({ ok: true });
}
