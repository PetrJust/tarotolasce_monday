// MOCK: replace with production (Stripe checkout + webhook).
// v1.1 §A: cena se určuje SERVER-SIDE. Intro 29 Kč jen jednou na účet
// (server-side rozhodnutí). Balíčky vyžadují přihlášení a připisují se
// idempotentně podle paymentIntentId. MOCK stav: podepsaná cookie
// (lib/cookieLedger.ts - hotfix serverless split-brain); produkce =
// PostgreSQL ledger (lib/account zůstává referenční implementací + testy).
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sessionUser } from "@/lib/account";
import {
  LEDGER_COOKIE, parseLedger, ledgerCredit, serializeLedger, ledgerCookieAttrs,
} from "@/lib/cookieLedger";
import { sendPurchaseEmail } from "@/lib/email";
import { PRICES } from "@/lib/pricing";
import { withApiGuard } from "@/lib/apiGuard";

const PRODUCTS: Record<string, { kind: "intro" | "single" | "pack"; credits?: number; price: number }> = {
  price_first_29: { kind: "intro", price: PRICES.first },
  price_single_49: { kind: "single", price: PRICES.single },
  price_pack5_199: { kind: "pack", credits: 5, price: PRICES.pack5 },
  price_pack20_599: { kind: "pack", credits: 20, price: PRICES.pack20 },
};

async function handlePOST(req: Request) {
  const { email, priceId } = await req.json().catch(() => ({}));
  if (typeof priceId !== "string" || !(priceId in PRODUCTS)) {
    return NextResponse.json({ error: "unknown product" }, { status: 400 });
  }
  const product = PRODUCTS[priceId];

  // Balíčky: jen přihlášená (kredit patří účtu, ne zařízení)
  const session = await sessionUser(cookies().get("tol_session")?.value);
  const buyerEmail =
    product.kind === "pack"
      ? session?.email
      : (session?.email ?? (typeof email === "string" ? email : null));
  if (product.kind === "pack" && !buyerEmail) {
    return NextResponse.json({ error: "login_required" }, { status: 401 });
  }
  if (!buyerEmail || !buyerEmail.includes("@")) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const ledger = parseLedger(cookies().get(LEDGER_COOKIE)?.value, buyerEmail);

  // Intro jen jednou - rozhoduje server (mock: flag v podepsané cookie)
  if (product.kind === "intro") {
    if (ledger.introUsed) {
      return NextResponse.json({ error: "intro_used", useSingle: true }, { status: 409 });
    }
  }

  // Mock platba: 1,5 s; „fail@" simuluje selhání
  await new Promise((r) => setTimeout(r, 1500));
  if (buyerEmail.includes("fail@")) {
    return NextResponse.json({ error: "payment_failed" }, { status: 402 });
  }
  const paymentIntent = `pi_mock_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  if (product.kind === "pack") {
    // = doručení Stripe webhooku; dvojité doručení připíše jen jednou (A.4)
    const credited = ledgerCredit(ledger, product.credits!, paymentIntent);
    const res = NextResponse.json({
      paymentIntent, balance: credited.balance, price: product.price,
    });
    res.cookies.set(LEDGER_COOKIE, serializeLedger(credited), ledgerCookieAttrs());
    return res;
  }

  // single/intro: e-mail s trvalým odkazem posílá stream route po uložení výkladu
  void sendPurchaseEmail; // (odesílá se po vzniku výkladu, ne tady)
  const res = NextResponse.json({ paymentIntent, price: product.price });
  if (product.kind === "intro") {
    res.cookies.set(
      LEDGER_COOKIE,
      serializeLedger({ ...ledger, introUsed: true }),
      ledgerCookieAttrs()
    );
  }
  return res;
}

export const POST = withApiGuard(handlePOST);
