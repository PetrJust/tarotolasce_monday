// Čtení/zápis nastavení výkladu z /dev/kredit (v1.6 dodatek).
// Zápis je dev nástroj - gated stejně jako ostatní /dev funkce.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  parseReadSettings,
  serializeReadSettings,
  READ_SETTINGS_COOKIE,
  type ReadSettings,
} from "@/lib/readSettings";

function devUnlocked(): boolean {
  const isProd = process.env.VERCEL_ENV === "production";
  const allowDevTools = process.env.ALLOW_DEV_TOOLS === "1";
  return !isProd || allowDevTools;
}

export async function GET() {
  const s = parseReadSettings(cookies().get(READ_SETTINGS_COOKIE)?.value);
  return NextResponse.json(s);
}

export async function POST(req: Request) {
  if (!devUnlocked()) {
    return NextResponse.json({ error: "not available" }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const next: ReadSettings = { allowReversed: body.allowReversed !== false };
  const res = NextResponse.json(next);
  res.cookies.set(READ_SETTINGS_COOKIE, serializeReadSettings(next), {
    httpOnly: false, // čte i klient (indikace stavu), integrita přes HMAC
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 365 * 86400,
  });
  return res;
}
