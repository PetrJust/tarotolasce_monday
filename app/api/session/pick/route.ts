// MOCK: replace with production
import { NextResponse } from "next/server";
import { pickCard } from "@/lib/sessions";

export async function POST(req: Request) {
  const { sessionId, index } = await req.json();
  if (typeof sessionId !== "string" || typeof index !== "number") {
    return NextResponse.json({ error: "sessionId and index required" }, { status: 400 });
  }
  const result = pickCard(sessionId, index);
  if (!result) {
    return NextResponse.json({ error: "invalid pick" }, { status: 400 });
  }
  return NextResponse.json(result);
}
