// MOCK: replace with production (vlastní AI model na AWS, reálné SSE)
// Streamuje výklad po slovech. Výklad se uloží PŘED začátkem streamu,
// takže kredit se nikdy nestrhne za nevydaný výklad.
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { mockReading } from "@/lib/mockReadings";
import { saveReading } from "@/lib/store";
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
  const { sessionId, question, cards, spread, useCredit } = await req.json();
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

  const text = mockReading(spread as SpreadKey, question ?? "", cards);
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

  const words = text.split(" ");
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

  const headers: Record<string, string> = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  };
  if (ledgerCookieHeader) headers["Set-Cookie"] = ledgerCookieHeader;
  return new Response(stream, { headers });
}

export const POST = withApiGuard(handlePOST);
