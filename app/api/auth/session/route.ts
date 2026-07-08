// Session: GET = kdo jsem, DELETE = odhlášení.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sessionUser, destroySession } from "@/lib/account";

export async function GET() {
  const u = await sessionUser(cookies().get("tol_session")?.value);
  return NextResponse.json({ email: u?.email ?? null });
}
export async function DELETE() {
  const token = cookies().get("tol_session")?.value;
  await destroySession(token);
  cookies().set("tol_session", "", { httpOnly: true, path: "/", maxAge: 0 });
  return NextResponse.json({ ok: true });
}
