// Historie jen pro přihlášenou (httpOnly session, v1.1 §B) - žádný
// přístup jen zadáním e-mailu.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sessionUser } from "@/lib/account";
import { readingsByEmail } from "@/lib/store";

export async function GET() {
  const u = await sessionUser(cookies().get("tol_session")?.value);
  if (!u) return NextResponse.json({ readings: [], loggedIn: false });
  const list = (await readingsByEmail(u.email)).map((r) => ({
    id: r.id,
    question: r.question,
    spreadName: r.spreadName,
    createdAt: r.createdAt,
  }));
  return NextResponse.json({ readings: list, loggedIn: true });
}
