// MOCK: replace with production
// Server-side seed; pořadí karet se NEPOSÍLÁ klientovi.
import { NextResponse } from "next/server";
import { createSession } from "@/lib/sessions";
import { SPREADS, SpreadKey } from "@/lib/spreads";

export async function POST(req: Request) {
  const { spread } = await req.json();
  if (!spread || !(spread in SPREADS)) {
    return NextResponse.json({ error: "invalid spread" }, { status: 400 });
  }
  const session = createSession(spread as SpreadKey);
  return NextResponse.json({ sessionId: session.id, deckSize: 78 });
}
