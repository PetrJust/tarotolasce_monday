// FLOW B (v1.6 §5): ZDARMA se generuje a streamuje jen ÚVOD výkladu.
// Teaser se vrací klientovi celý (klient ho pak pošle odemčení jako
// vstup - v produkci jde plné generaci jako prefix promptu; v mocku je
// kontinuita zaručená konstrukcí, viz lib/mockReadings.mockFlowB).
//
// OCHRANA (5.5): 1 nezaplacená ochutnávka / den / kombinace session+e-mail
// (spolehlivě přes podepsanou cookie) + MĚKKÝ limit na IP ~5/den.
// TODO produkce: IP limit v Redis/DB - na serverless mocku je počítadlo
// v paměti instance jen best-effort závorka (viz PR-POPIS KONFLIKT 3).
//
// BEZPEČNOST (§9, invariant 8): krizová odpověď se NIKDY nezamyká za
// fólii - při zachycení krize se vrací celá, flag crisis=true a klient
// nezobrazuje fólii ani platbu.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { mockFlowB } from "@/lib/mockReadings";
import { moderate } from "@/lib/moderation";
import { sessionUser } from "@/lib/account";
import { SPREADS, SpreadKey } from "@/lib/spreads";
import { withApiGuard } from "@/lib/apiGuard";

const SECRET = process.env.SESSION_SECRET ?? "tol-mock-session-secret";
const hmac = (s: string) =>
  crypto.createHmac("sha256", SECRET).update(s).digest("base64url");

// Měkký IP limit (best-effort na instanci)
const ipCounts = new Map<string, { day: string; n: number }>();
const IP_SOFT_LIMIT = 5;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function handlePOST(req: Request) {
  const { sessionId, question, cards, spread, email } = await req.json().catch(() => ({}));
  if (!sessionId || !Array.isArray(cards) || !cards.length || !spread || !(spread in SPREADS)) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  // Krize: jedna empatická věta + Linka; celé, bez fólie (invariant 8)
  const mod = moderate(String(question ?? ""));
  if (mod !== "ok") {
    return NextResponse.json({
      crisis: true,
      teaser:
        "Tohle zní jako něco, na co nemáš být sama, a karty na to nejsou ta správná odpověď. Jsem tu, ale teď je důležitější živý člověk: Linka první psychické pomoci 116 123 je tu pro tebe kdykoli, zdarma a důvěrně.",
    });
  }

  // Limit 1 ochutnávka/den/kombinace session+e-mail (podepsaná cookie)
  const u = await sessionUser(cookies().get("tol_session")?.value);
  const identity = (u?.email ?? (typeof email === "string" ? email : "") ?? "").toLowerCase();
  const day = todayKey();
  const jar = cookies();
  const raw = jar.get("tol_teaser")?.value ?? "";
  const [payload, sig] = raw.split(".");
  let used: Record<string, string> = {};
  if (payload && sig === hmac(payload)) {
    try { used = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")); } catch {}
  }
  // Jméno z profilu do ř. 1 (fallback bez oslovení)
  const name = decodeURIComponent(jar.get("tol_name")?.value ?? "");
  const { teaser } = mockFlowB(spread as SpreadKey, String(question ?? ""), cards, name);

  const key = identity || "anon";
  const already = used[key] === day && used[`sid:${key}`] !== String(sessionId);

  // Měkký IP limit (best-effort)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rec = ipCounts.get(ip);
  const ipOver = rec && rec.day === day && rec.n >= IP_SOFT_LIMIT;

  // Když je denní ochutnávka vyčerpaná, uživatele NEBLOKUJEME hláškou -
  // pořád mu ukážeme úvod výkladu a pošleme rovnou k odemčení (celý
  // výklad si může koupit kdykoli). limited příznak je jen pro analytiku.
  if (already || ipOver) {
    return NextResponse.json({ teaser, limited: true });
  }
  ipCounts.set(ip, { day, n: rec && rec.day === day ? rec.n + 1 : 1 });

  // zapiš čerpání dnešní ochutnávky (idempotentní na sessionId - refresh
  // téže ochutnávky limit nespálí podruhé)
  used[key] = day;
  used[`sid:${key}`] = String(sessionId);
  const newPayload = Buffer.from(JSON.stringify(used), "utf8").toString("base64url");
  const res = NextResponse.json({ teaser });
  res.cookies.set("tol_teaser", `${newPayload}.${hmac(newPayload)}`, {
    httpOnly: true, sameSite: "lax", path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 2 * 86400,
  });
  return res;
}

export const POST = withApiGuard(handlePOST);
