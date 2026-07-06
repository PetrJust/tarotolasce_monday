// MOCK: replace with production (Haiku moderace)
import { NextResponse } from "next/server";
import { moderate } from "@/lib/moderation";

export async function POST(req: Request) {
  const { question } = await req.json();
  if (typeof question !== "string") {
    return NextResponse.json({ error: "question required" }, { status: 400 });
  }
  return NextResponse.json({ status: moderate(question) });
}
