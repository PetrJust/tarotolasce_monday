# PR popis — implementace zadání v1.6 FINAL

## `[BLOKER]` §4 Ledger — odpověď týmu (PRVNÍ VĚC)

Odpověď se od v1.5 nemění (architektura je stejná):

**1. Kredit server-side vázaný na user_id? NE v běžícím mocku** — po
serverless hotfixu cestuje v podepsané cookie (prohlížeč + ověřený
e-mail). **ANO v referenční implementaci** lib/account.ts (append-only,
SUM, idempotence), která je připravená pro PostgreSQL (schema.sql).

**2. „Na tomhle zařízení" = realita dat v mocku** (výklady v /tmp
instance, počet z lokální cookie). Copy fix „Zatím sis vyložila {n}
výklad/y/ů." je nasazený; skutečná migrace dat k účtu = priorita č. 1.

**3. Šest testů:** referenční lib/account 6/6 ✅; běžící cookie-mock:
(a)(b)(d)(f) ✅, **(c) ❌** (kredit vázaný na prohlížeč), **(e) ⚠️**
(anonymní okno = nová cookie; server-side jen s DB).

**Závěr: trojí ANO zatím není → datum launche určuje migrace na
PostgreSQL.** Flow B, ceník i balíčky jsou implementované a na preview
plně testovatelné (Stripe test mode).

---

## KONFLIKTY (v1.6 vs. realita — pravidlo §0/3)

1. **§0 přílohy „logo SVG (symbol, rub-karty, favicon-16)" NEJSOU
   dodané.** Srdcový rub, symbol i favicon jsou implementované z textového
   popisu (§3) v tokens v3; až dorazí auditované SVG, vymění se 1:1
   v components/TarotCard.tsx (CardBack), components/LogoSymbol.tsx,
   app/icon.svg, public/icon-512.svg.
2. **§8 „karusel průvodkyň: bez číslování, tečky"** — v buildu žádný
   karusel neexistuje (Spirio most je box + CTA). Není co upravovat.
3. **§5.5 měkký limit na IP** — na serverless mocku je best-effort
   (počítadlo v paměti instance; instance se střídají). Tvrdý limit
   session+e-mail (podepsaná cookie) funguje spolehlivě; IP limit
   nabude plné síly s DB/Redis v produkci. V kódu připraveno s TODO.
4. **§6 „loguje se doručení pozvánky"** — ranní odesílání nemá v mocku
   cron; `daily_invite_sent` se loguje v mock odesílací vrstvě
   (lib/email) a proklik přes parametr `?from=invite` na /karta-dne.
   Reálný cron = produkční infra.
5. **§7.6 obrazovka otázky** — v1.6 dává jen CTA „Položit otázku";
   dřívější v1.3 text disabled stavu („Nejdřív napiš otázku") v1.6
   neuvádí → disabled stav zůstává (tlačítko neaktivní bez textu),
   label je konstantně „Položit otázku" (invariant 2: žádné copy mimo
   zadání).
6. **§9 „slepé srovnání s texty 7.2"** — vyžaduje lidské oko/LLM juror;
   strojová část golden setu pokrývá zbylá kritéria, slepé srovnání je
   v checklistu jako manuální krok.
7. **§12 „Lora potvrzena zakladatelem pohledem"** + **§3 lockup
   [ČEKÁ NA ROMANA]** — manuální kroky mimo kód.

## Log rozhodnutí

- **6. 7. 2026 — zakladatel:** checkbox §1837 se v paywallu nezobrazuje;
  flag `SHOW_1837_CONSENT` default off, kód checkboxu zůstává. Právo na
  odstoupení 14 dní trvá; OP nesmí tvrdit opak (§10.2).
- **v1.6 — zakladatel:** Flow B rovnou bez A/B; staré flow za flagem
  `FLOW_CLASSIC` (default off, návrat = přepnutí flagu).
- **v1.6 — zakladatel (2× potvrzeno):** karta dne bez rituálu, jeden dotek.

## Flagy

- `FLOW_CLASSIC` = off → Flow B (teaser → fólie → platba → navázání).
- `SHOW_1837_CONSENT` = off → checkbox §1837 skrytý.
