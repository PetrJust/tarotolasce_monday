// MOCK: replace with production (vlastní AI model na AWS, reálné SSE)
// Streamuje výklad po slovech. Výklad se uloží PŘED začátkem streamu,
// takže kredit se nikdy nestrhne za nevydaný výklad.
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { mockReading, mockFlowB } from "@/lib/mockReadings";
import { saveReading } from "@/lib/store";
import { READINGS_COOKIE, addReading, serializeSetCookie } from "@/lib/cookieReadings";
import { sessionUser } from "@/lib/account";
import {
  LEDGER_COOKIE, parseLedger, ledgerConsume, ledgerSetCookieHeader,
} from "@/lib/cookieLedger";
import { sendPurchaseEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/site";
import { SPREADS, SpreadKey } from "@/lib/spreads";
import { withApiGuard } from "@/lib/apiGuard";

export const dynamic = "force-dynamic";

async function handlePOST(req: NextRequest) {
  // FLOW B (v1.6 §5.4): flowB=true + teaser -> plná generace dostane
  // teaser jako vstup a stream NAVÁŽE PŘESNĚ tam, kde úvod skončil
  // (klientovi se posílá jen pokračování; uloží se celý text).
  // Kontinuita je v mocku zaručená konstrukcí (mockFlowB: teaser je
  // přesný prefix plného textu). Odemčení působí okamžitě: stream
  // startuje hned (<2 s po platbě).
  const { sessionId, question, cards, spread, useCredit, flowB, teaser } = await req.json();
  if (!sessionId || !Array.isArray(cards) || !spread || !(spread in SPREADS)) {
    return new Response("bad request", { status: 400 });
  }

  // Čerpání z balíčku: rozhoduje SERVER podle ledgeru, ne frontend (A.2).
  // Idempotentní na sessionId - obnovení stránky nestrhne kredit dvakrát.
  // MOCK: ledger v podepsané cookie (lib/cookieLedger.ts) - nová hodnota
  // se posílá Set-Cookie hlavičkou na streamované odpovědi níže.
  let ledgerCookieHeader: string | null = null;
  if (useCredit) {
    const u = await sessionUser(cookies().get("tol_session")?.value);
    if (!u) return new Response("login required", { status: 401 });
    const ledger = parseLedger(cookies().get(LEDGER_COOKIE)?.value, u.email);
    const c = ledgerConsume(ledger, String(sessionId));
    if (!c.ok) return new Response("insufficient credit", { status: 402 });
    ledgerCookieHeader = ledgerSetCookieHeader(c.ledger);
  }

  // Jméno z profilu (mock: cookie tol_name) - úvod výkladu
  const profileName = decodeURIComponent(cookies().get("tol_name")?.value ?? "");
  let text: string;
  let streamFrom = 0; // Flow B: klientovi se streamuje až od konce teaseru
  if (flowB) {
    const fb = mockFlowB(spread as SpreadKey, question ?? "", cards, profileName);
    text = fb.full;
    // navázání: preferuj skutečný teaser z požadavku (produkce: prefix
    // promptu); fallback na vlastní konstrukci
    const t = typeof teaser === "string" && text.startsWith(teaser) ? teaser : fb.teaser;
    streamFrom = t.length;
  } else {
    text = mockReading(spread as SpreadKey, question ?? "", cards, profileName);
  }
  const su = await sessionUser(cookies().get("tol_session")?.value);
  const email = su?.email ?? cookies().get("tol_email")?.value ?? null;
  const saved = await saveReading({
    email,
    question: question ?? "",
    spreadKey: spread,
    spreadName: SPREADS[spread as SpreadKey].name,
    cards,
    text,
  });

  if (email) {
    void sendPurchaseEmail(email, `${SITE_URL}/vyklad/${saved.id}`).catch(() => {});
  }

  // Ulož výklad i do podepsané cookie (interim historie do PostgreSQL) -
  // aby ho jiná serverless instance při otevření detailu spolehlivě našla
  // (soubor/paměťový store je per-instance ephemerní). Cookie drží jen
  // kompaktní záznam; text výkladu se v detailu regeneruje z karet.
  const readingsRaw = cookies().get(READINGS_COOKIE)?.value;
  const readingsCookieValue = addReading(readingsRaw, {
    id: saved.id,
    question: question ?? "",
    spreadKey: spread,
    spreadName: SPREADS[spread as SpreadKey].name,
    name: profileName,
    cards,
    createdAt: saved.createdAt,
  });
  const readingsCookieHeader = serializeSetCookie(
    READINGS_COOKIE,
    readingsCookieValue
  );

  const continuation = streamFrom > 0 ? text.slice(streamFrom) : text;
  const words = continuation.split(" ");
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(`event: meta\ndata: ${JSON.stringify({ readingId: saved.id })}\n\n`)
      );
      for (const word of words) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ t: word + " " })}\n\n`)
        );
        // 30 az 60 ms na slovo s mírnou variancí pro organický dojem;
        // delší pauza po konci věty (dojem odstavce)
        const endsSentence = /[.!?]$/.test(word);
        const base = 30 + Math.random() * 30;
        await new Promise((r) => setTimeout(r, endsSentence ? base + 300 : base));
      }
      controller.enqueue(encoder.encode("event: done\ndata: {}\n\n"));
      controller.close();
    },
  });

  const resHeaders = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });
  if (ledgerCookieHeader) resHeaders.append("Set-Cookie", ledgerCookieHeader);
  resHeaders.append("Set-Cookie", readingsCookieHeader);
  return new Response(stream, { headers: resHeaders });
}

export const POST = withApiGuard(handlePOST);
