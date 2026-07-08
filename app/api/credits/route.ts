// Zůstatek = SUM(delta) z ledgeru, vázaný na účet (session). Kredit
// koupený na zařízení A je po přihlášení dostupný na zařízení B (test A.3).
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sessionUser, getBalanceByEmail } from "@/lib/account";

export async function GET() {
  const u = await sessionUser(cookies().get("tol_session")?.value);
  if (!u) return NextResponse.json({ balance: 0, loggedIn: false });
  const balance = await getBalanceByEmail(u.email);
  return NextResponse.json({ balance, loggedIn: true });
}
