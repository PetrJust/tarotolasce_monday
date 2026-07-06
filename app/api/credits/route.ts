// Zůstatek vázaný na účet (session). MOCK: ledger cestuje v podepsané
// cookie (viz lib/cookieLedger.ts - hotfix serverless split-brain);
// produkce = SUM(delta) z PostgreSQL ledgeru (schema.sql, testy A.1-A.6
// nad lib/account zůstávají laťkou pro produkční implementaci).
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sessionUser } from "@/lib/account";
import { LEDGER_COOKIE, parseLedger } from "@/lib/cookieLedger";
import { withApiGuard } from "@/lib/apiGuard";

async function handleGET() {
  const u = await sessionUser(cookies().get("tol_session")?.value);
  if (!u) return NextResponse.json({ balance: 0, loggedIn: false });
  const ledger = parseLedger(cookies().get(LEDGER_COOKIE)?.value, u.email);
  return NextResponse.json({ balance: ledger.balance, loggedIn: true });
}

export const GET = withApiGuard(handleGET);
