# PR popis — implementace zadání v1.5 (konsolidované)

## `[BLOKER]` §4 Ledger — odpověď týmu (PRVNÍ VĚC)

**1. Je kredit server-side, vázaný na user_id ověřeného účtu (ne device/cookie)?**

**NE — v aktuálním mock buildu ne, a je to vědomé dočasné rozhodnutí.**
Stav po hotfixu serverless split-brainu (session 4):

- **Referenční implementace** `lib/account.ts` JE server-side, vázaná na
  účet (user_id z ověřeného e-mailu), append-only ledger, zůstatek = SUM.
  Prochází všech 6 testů (a)–(f), viz níže.
- **Běžící mock na Vercelu** ale nemá sdílené úložiště (serverless
  instance mají oddělené /tmp; soubor na disku způsoboval náhodné mizení
  sessions/kreditů). Proto kreditní stav dočasně cestuje v HMAC-podepsané
  httpOnly cookie → je vázaný na **prohlížeč + ověřený e-mail**, ne čistě
  na účet napříč zařízeními.
- **Priorita č. 1 pro produkci: PostgreSQL dle schema.sql** (hotové DDL v
  repu). Po migraci se routy přepnou z cookie ledgeru zpět na lib/account
  nad DB — rozhraní je identické, testy A jsou připravené.

**2. „Na tomhle zařízení" v profilu — copy relikt, nebo realita dat?**

**Realita dat v mocku.** Počet výkladů se počítal z lokální cookie
(clientState) a uložené výklady leží v /tmp instance. Copy fix DOSLOVA
(„Zatím sis vyložila {n} výklad/y/ů.") je v tomto PR nasazený; skutečná
migrace výkladů i kreditů k účtu = součást migrace na DB (priorita č. 1).

**3. Šest testů:**

| test | lib/account (referenční) | mock cookie ledger na Vercelu |
|---|---|---|
| (a) append-only, SUM | ✅ | ✅ (refs + balance v podepsané cookie) |
| (b) čerpání při 0 odmítá server | ✅ | ✅ |
| (c) kredit napříč zařízeními | ✅ | ❌ (vázané na prohlížeč — limit mocku) |
| (d) idempotence payment_intent_id | ✅ | ✅ |
| (e) intro jen jednou na účet i z anonymního okna | ✅ | ⚠️ částečně (anonymní okno = jiná cookie → obejde; server-side jen s DB) |
| (f) žádná enumerace e-mailů | ✅ | ✅ |

**Závěr pro launch: trojí ANO zatím NENÍ. Balíčky neprodávat ostře,
dokud neproběhne migrace na PostgreSQL (testy c + e vyžadují sdílené
server-side úložiště, které serverless mock z principu nemá).**
Na preview/testování balíčky fungují (Stripe test mode).

---

## KONFLIKTY (zadání vs. realita buildu — pravidlo §0/3)

1. **§5.5 carousel průvodkyň**: v buildu žádný carousel s počítadlem
   „Průvodkyně · 1 z 10" neexistuje (Spirio most je textový box + CTA).
   Není co odstraňovat; nadpis „Naše průvodkyně" a tečky nasadíme až
   s carouselem (nestavíme — není položkou ZMĚNA „postavit carousel").
2. **§5.9 disclaimer dle GPT sekce 19**: „GPT copy balíček" (docx) není
   přiložen. Současný text patičky už obsahuje požadované „ani krizovou
   pomoc" — povýšen na sdílenou konstantu `DISCLAIMER` (lib/site.ts)
   a nahrazeny všechny lokální kopie. Až dorazí finální znění ze sekce 19,
   změní se na JEDNOM místě.
3. **§5.8 logo assety v1 + v2**: přílohy nejsou dodané. Symbol (karta +
   soft-gold rám + srdce), TOL pečeť, wordmark v Loře a tagline jsou
   implementované z textového popisu zadání v tokens v3; finální schválení
   wordmarku `[ČEKÁ NA ROMANA]`.
4. **§3 zakázaný hex #3C1146**: v repu se nikdy nevyskytoval (grep čistý
   před i po). Ostatní tři odstraněny.
5. **§5.10 „Roman narazil na opakované kódy"**: příčinou byl serverless
   split-brain (session v /tmp jedné instance) — opraveno bezstavovou
   podepsanou session (session 4) + v tomto PR rolling 90 dní.

## Log rozhodnutí

- **6. 7. 2026 — zakladatel:** checkbox §1837 se v checkoutu nezobrazuje;
  skrytý za flag `SHOW_1837_CONSENT` (default off), kód checkboxu zůstává.
  Právo na odstoupení 14 dní trvá; OP nesmí obsahovat §1837 zánik.
  (Zadání v1.5 §5.1.)
