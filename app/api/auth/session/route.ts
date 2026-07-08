// Session: GET = kdo jsem, DELETE = odhlášení.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sessionUser, destroySession, signSessionToken } from "@/lib/account";
import { withApiGuard } from "@/lib/apiGuard";

async function handleGET() {
  const u = await sessionUser(cookies().get("tol_session")?.value);
  // v1.5 §5.10: ROLLING 90 dní - každá návštěva prodlouží platnost.
  // Kód znovu jen: nové zařízení, odhlášení, smazaná data. (Dřívější
  // „opakované kódy" způsoboval serverless split-brain, opraveno
  // bezstavovou session; rolling drží denní uživatelku bez loginu.)
  if (u) {
    cookies().set("tol_session", signSessionToken(u.email), {
      httpOnly: true, sameSite: "lax", path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 90 * 86400,
    });
  }
  return NextResponse.json({ email: u?.email ?? null });
}
async function handleDELETE() {
  const token = cookies().get("tol_session")?.value;
  await destroySession(token);
  cookies().set("tol_session", "", { httpOnly: true, path: "/", maxAge: 0 });
  return NextResponse.json({ ok: true });
}

export const GET = withApiGuard(handleGET);
export const DELETE = withApiGuard(handleDELETE);
