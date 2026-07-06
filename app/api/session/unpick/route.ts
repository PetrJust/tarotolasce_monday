// MOCK: replace with production
import { NextResponse } from "next/server";
import { unpickCard } from "@/lib/sessions";

export async function POST(req: Request) {
  const { sessionId, index } = await req.json();
  if (typeof sessionId !== "string" || typeof index !== "number") {
    return NextResponse.json({ error: "sessionId and index required" }, { status: 400 });
  }
  const result = unpickCard(sessionId, index);
  if (!result) {
    return NextResponse.json({ error: "not picked" }, { status: 400 });
  }
  return NextResponse.json(result);
}
