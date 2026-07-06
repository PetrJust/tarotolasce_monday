// MOCK: replace with production (analytický backend)
// Přijímá události z lib/analytics.ts a v mocku je jen loguje.
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const evt = await req.json();
    console.log("[analytics]", evt?.name, JSON.stringify(evt?.data ?? {}));
  } catch {
    /* ignore */
  }
  return NextResponse.json({ ok: true });
}
