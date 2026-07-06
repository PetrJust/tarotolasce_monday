// MOCK: replace with production
import { NextResponse } from "next/server";
import { classify } from "@/lib/classifier";

export async function POST(req: Request) {
  const { question } = await req.json();
  if (typeof question !== "string") {
    return NextResponse.json({ error: "question required" }, { status: 400 });
  }
  return NextResponse.json(classify(question));
}
