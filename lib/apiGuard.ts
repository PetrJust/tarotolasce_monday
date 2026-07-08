// Obranný wrapper pro API routy (hotfix po incidentu s read-only FS na
// Vercelu - viz lib/account.ts). Kdyby cokoli v route handleru neočekávaně
// spadlo (fs, síť, cokoli), tenhle wrapper to odchytí a vrátí čitelnou
// JSON 500 odpověď MÍSTO prázdného těla, které se v prohlížeči projevuje
// jako matoucí "SyntaxError: JSON.parse: unexpected end of data".
import { NextResponse } from "next/server";

export function withApiGuard<A extends unknown[]>(
  handler: (...args: A) => Promise<Response>
) {
  return async (...args: A): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      console.error("[api] neošetřená chyba:", err);
      return NextResponse.json(
        { ok: false, error: "server_error" },
        { status: 500 }
      );
    }
  };
}
