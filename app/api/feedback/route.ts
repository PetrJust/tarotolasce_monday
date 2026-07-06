// MOCK: replace with production (uložení hodnocení výkladu)
import { NextResponse } from "next/server";
import { saveFeedback } from "@/lib/store";

export async function POST(req: Request) {
  const { readingId, rating, comment } = await req.json();
  if (typeof readingId !== "string" || (rating !== "up" && rating !== "down")) {
    return NextResponse.json({ error: "readingId and rating required" }, { status: 400 });
  }
  await saveFeedback(readingId, rating, typeof comment === "string" ? comment : "");
  return NextResponse.json({ ok: true });
}
