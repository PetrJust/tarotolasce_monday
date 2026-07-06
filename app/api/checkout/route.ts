// MOCK: replace with production (Stripe checkout + webhook).
// v1.1 §A: cena se určuje SERVER-SIDE. Intro 29 Kč jen jednou na účet
// (i z anonymního okna - vazba na e-mail/účet, ne na cookie). Balíčky
// vyžadují přihlášení (kredit se váže na účet) a připisují se idempotentně
// přes creditPurchase (paymentIntentId = webhookový ref).
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { creditPurchase, sessionUser, tryUseIntro } from "@/lib/account";
import { sendPurchaseEmail } from "@/lib/email";
import { PRICES } from "@/lib/pricing";

const PRODUCTS: Record<string, { kind: "intro" | "single" | "pack"; credits?: number; price: number }> = {
  price_first_29: { kind: "intro", price: PRICES.first },
  price_single_49: { kind: "single", price: PRICES.single },
  price_pack5_199: { kind: "pack", credits: 5, price: PRICES.pack5 },
  price_pack20_599: { kind: "pack", credits: 20, price: PRICES.pack20 },
};

export async function POST(req: Request) {
  const { email, priceId } = await req.json().catch(() => ({}));
  if (typeof priceId !== "string" || !(priceId in PRODUCTS)) {
    return NextResponse.json({ error: "unknown product" }, { status: 400 });
  }
  const product = PRODUCTS[priceId];

  // Balíčky: jen přihlášená (kredit patří účtu, ne zařízení)
  const session = await sessionUser(cookies().get("tol_session")?.value);
  const buyerEmail =
    product.kind === "pack" ? session?.email : typeof email === "string" ? email : null;
  if (product.kind === "pack" && !buyerEmail) {
    return NextResponse.json({ error: "login_required" }, { status: 401 });
  }
  if (!buyerEmail || !buyerEmail.includes("@")) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  // Intro jen jednou na účet - rozhoduje server (test A.5)
  if (product.kind === "intro") {
    const intro = await tryUseIntro(buyerEmail);
    if (!intro.ok) {
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
    const credited = await creditPurchase(buyerEmail, product.credits!, paymentIntent);
    return NextResponse.json({ paymentIntent, balance: credited.balance, price: product.price });
  }

  // single/intro: e-mail s trvalým odkazem posílá stream route po uložení výkladu
  void sendPurchaseEmail; // (odesílá se po vzniku výkladu, ne tady)
  return NextResponse.json({ paymentIntent, price: product.price });
}
