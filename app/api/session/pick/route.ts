// MOCK: replace with production
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pickCard } from "@/lib/sessions";
import { parseReadSettings, READ_SETTINGS_COOKIE } from "@/lib/readSettings";

export async function POST(req: Request) {
  const { sessionId, index } = await req.json();
  if (typeof sessionId !== "string" || typeof index !== "number") {
    return NextResponse.json({ error: "sessionId and index required" }, { status: 400 });
  }
  const result = pickCard(sessionId, index);
  if (!result) {
    return NextResponse.json({ error: "invalid pick" }, { status: 400 });
  }
  // Přepínač z /dev/kredit: když jsou obrácené karty vypnuté, vynutíme
  // normální orientaci (obrácení se ignoruje na výstupu). Text výkladu
  // se řídí polem reversed, takže tímhle se sladí i engine.
  const settings = parseReadSettings(cookies().get(READ_SETTINGS_COOKIE)?.value);
  if (!settings.allowReversed && result.reversed) {
    result.reversed = false;
  }
  return NextResponse.json(result);
}
