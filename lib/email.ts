// E-mailová infrastruktura (v1.1 §I). Šablony provider-agnostické:
// MOCK provider loguje + ukládá do .data/outbox.json (náhled v /dev/emails);
// s RESEND_API_KEY posílá přes Resend. Při migraci na SPIRIO AWS se vymění
// jen funkce deliver() za SES. Jednotný odesílatel, transakční e-maily
// bez marketingového obsahu.
import fs from "fs";
import path from "path";
import { EMAIL_SENDER, PERSONA_NAME } from "./persona";
import { OPERATOR } from "./site";

type Mail = { to: string; subject: string; text: string };

async function deliver(mail: Mail) {
  const key = process.env.RESEND_API_KEY;
  if (key) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: EMAIL_SENDER, to: mail.to, subject: mail.subject, text: mail.text }),
    });
    return;
  }
  // MOCK: log + outbox pro /dev/emails
  console.log(`[email] to=${mail.to} subject=${mail.subject}`);
  try {
    const dir = process.env.TOL_DATA_DIR ?? path.join(process.cwd(), ".data");
    const f = path.join(dir, "outbox.json");
    fs.mkdirSync(dir, { recursive: true });
    let arr: Mail[] = [];
    try { arr = JSON.parse(fs.readFileSync(f, "utf8")); } catch { /* prázdný */ }
    arr.unshift({ ...mail });
    fs.writeFileSync(f, JSON.stringify(arr.slice(0, 50)), "utf8");
  } catch { /* mock */ }
}

/** OTP: kód přímo v PŘEDMĚTU (čte se z notifikace bez otevření mailu). */
export async function sendOtpEmail(to: string, code: string) {
  await deliver({
    to,
    subject: `Tvůj kód pro Tarot o Lásce: ${code}`,
    text: [
      "Tady je tvůj přihlašovací kód. Platí deset minut a jen jednou.",
      "Pokud sis ho nevyžádala, klidně tenhle e-mail ignoruj.",
      "",
      `${OPERATOR}, provozovatel Tarotu o Lásce`,
    ].join("\n"),
  });
}

/** Po nákupu: trvalý odkaz na výklad; BEZ přihlašovacího odkazu (v1.1 B.3). */
export async function sendPurchaseEmail(to: string, readingUrl: string) {
  await deliver({
    to,
    subject: "Tvůj výklad od AI kartářky " + PERSONA_NAME,
    text: [
      "Tady je trvalý odkaz na tvůj výklad:",
      readingUrl,
      "",
      "Ke svému účtu se kdykoli přihlásíš kódem - stačí e-mail.",
      "",
      `${OPERATOR}, provozovatel Tarotu o Lásce`,
    ].join("\n"),
  });
}
