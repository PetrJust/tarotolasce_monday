// Historie jen pro přihlášenou (httpOnly session, v1.1 §B) - žádný
// přístup jen zadáním e-mailu. Zdroj: podepsaná cookie (interim historie
// do PostgreSQL, spolehlivá per prohlížeč na serverless), sjednocená se
// server store kvůli produkci s DB / starším odkazům.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sessionUser } from "@/lib/account";
import { readingsByEmail } from "@/lib/store";
import { READINGS_COOKIE, parseReadings } from "@/lib/cookieReadings";
import { withApiGuard } from "@/lib/apiGuard";

async function handleGET() {
  const u = await sessionUser(cookies().get("tol_session")?.value);

  // 1) cookie historie (spolehlivá per prohlížeč)
  const cookieList = parseReadings(cookies().get(READINGS_COOKIE)?.value).map((r) => ({
    id: r.id,
    question: r.question,
    spreadName: r.spreadName,
    cardCount: Array.isArray(r.cards) ? r.cards.length : 0,
    createdAt: r.createdAt,
  }));

  // 2) server store (DB/soubor) - pro přihlášené a produkci
  let serverList: typeof cookieList = [];
  if (u) {
    serverList = (await readingsByEmail(u.email)).map((r) => ({
      id: r.id,
      question: r.question,
      spreadName: r.spreadName,
      cardCount: Array.isArray(r.cards) ? r.cards.length : 0,
      createdAt: r.createdAt,
    }));
  }

  // sloučit + deduplikovat podle id, seřadit od nejnovějšího
  const byId = new Map<string, (typeof cookieList)[number]>();
  for (const it of [...serverList, ...cookieList]) byId.set(it.id, it);
  const list = [...byId.values()].sort((a, b) => b.createdAt - a.createdAt);

  return NextResponse.json({ readings: list, loggedIn: !!u });
}

export const GET = withApiGuard(handleGET);
