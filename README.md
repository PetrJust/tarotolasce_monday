# TAROT O LÁSCE (tarotolasce.cz)

Webová aplikace pro AI tarotové výklady o lásce a vztazích. Postaveno podle
zadání „Zadání pro vibecoding v1" kompletně ve funkčním **MOCK režimu**.

## Spuštění

```bash
npm install
npm run dev
```

Aplikace běží na http://localhost:3000. Produkční build a SSR/SSG ověření:

```bash
npm run build && npm start
```

## Nasazení a databáze

- Návod na nasazení (Webglobe, Node.js): viz `DEPLOY.md`.
- Bez proměnné `DATABASE_URL` aplikace ukládá výklady do souboru `.data/`
  (stačí na vývoj). V produkci nastav PostgreSQL přes `DATABASE_URL` a data se
  začnou ukládat do databáze, beze změny kódu. Schéma: `schema.sql` (vytvoří se
  i automaticky při prvním připojení).
- Proměnné prostředí: zkopíruj `.env.example` do `.env.local` a doplň hodnoty.
  Veřejnou doménu nastav přes `NEXT_PUBLIC_SITE_URL`.

## Testy

```bash
npm test
```

Pokrývá klasifikátor (12 testovacích otázek z akceptačního kritéria 4),
moderaci, skloňování (1 / 2 až 4 / 5+) a serverové míchání (determinismus,
27 % reversed, pravidla výběru a krok zpět). Soubory v `tests/`.

## Tech stack

- Next.js 14 (App Router, server components, SSR/SSG)
- TypeScript, Tailwind CSS, Framer Motion
- Žádné 3D knihovny; animace karet jsou CSS 3D transforms

## Mock režim: co je simulované

| Oblast | Mock chování | Kde |
|---|---|---|
| Platba | Vždy uspěje po 1,5 s; e-mail obsahující `fail@` vyvolá selhání | `app/api/checkout/route.ts` |
| AI výklad | Předpřipravené texty (kap. 9.2) + variace ve stejném tónu, streamované po slovech (SSE) | `app/api/reading/stream/route.ts`, `lib/mockReadings.ts` |
| Moderace | Keyword pravidla (kap. 6.4) | `lib/moderation.ts` |
| Klasifikace | Pravidla kap. 6.1 | `lib/classifier.ts` |
| Míchání | Server-side, seed odvozený ze sessionId. Stejná session = stejné pořadí (deterministické i po restartu). Pořadí se klientovi nikdy neposílá. Reversed 27 % rozhodnuto při míchání | `lib/sessions.ts` |
| Přihlášení | Mock magic link; v dev je tlačítko „Otevřít odkaz z e-mailu" | `app/prihlaseni/page.tsx` |
| E-maily | Nikam se neposílají; náhledy všech šablon na `/dev/emails` | `app/dev/emails/page.tsx` |
| Úložiště výkladů | In-memory na serveru (po restartu dev serveru se vyprázdní) | `lib/store.ts` |
| Kredity/balíčky | Cookie `tol_credits` (mock per browser) | `lib/clientState.ts` |
| Karta dne 1× denně | Cookie `tol_daily` (mock per browser) | `app/karta-dne/page.tsx` |

Všechny mock implementace jsou označené komentářem `// MOCK: replace with production`.

## Produkční výměna (beze změny frontendu)

API kontrakty z kapitoly 8 jsou dodržené 1:1 v `/app/api/*`:

```
POST /api/moderate        → Haiku moderace
POST /api/classify        → produkční klasifikátor
POST /api/session/shuffle → server-side shuffle (Supabase session)
POST /api/session/pick    → výběr karty ze serverového pořadí
POST /api/reading/stream  → vlastní AI model na AWS (SSE)
POST /api/checkout        → Stripe
POST /api/auth/magiclink  → Supabase auth
GET  /api/readings        → Postgres
```

## Testovací vstupy

- **Krize A:** otázka obsahující „nechci žít" → obrazovka 7.4-A
- **Krize B:** „bije mě" → 7.4-B (bez Spirio nabídky, vědomá výjimka)
- **Krize C:** „je mi 16" → 7.4-C
- **Selhání platby:** e-mail `test+fail@example.com` na checkoutu
- **Expirovaný magic link:** `/prihlaseni?expired=1`
- **Klasifikátor:** „Miluje mě?" → Ano/Ne; „Vrátí se mi ex?" → Já a můj ex;
  „Jak to mezi námi je?" → Jak to mezi námi je; vágní text → default 3 karty

## Obsahové TODO

- 5 karet v knihovně je plně napsaných (Zamilovaní, Věž, Smrt, Dvojka pohárů,
  Trojka mečů); zbylých 73 má strukturovaný placeholder `TODO_CONTENT`.
  Placeholder karty jsou `noindex` a nejsou v sitemap, dokud se nedoplní
  (zdroj pravdy: `WRITTEN_CARD_SLUGS` v `lib/cardContent.ts`). Po dopsání karty
  stačí přidat její obsah do `FULL` a indexace i sitemap se zapnou samy.
- Právní stránky obsahují `TODO` značky pro právníka
- Provozovatel v patičce: `{TODO}`
- Spirio landing URL: `https://spirio.cz/landing-TBD` (UTM parametry hotové)


## Testování na preview (pro zakladatele) - v1.3 §5

Dev a test režim se řídí `VERCEL_ENV`: na **preview** je zapnutý, na
**produkci neexistuje** (hlídá `npm run deploy-check`, spouští se
automaticky před buildem) - POKUD ho vědomě neodemkneš přepínačem níže.

**Jak si projít nákup end-to-end na preview:**

1. Na preview deployi nastav env proměnné:
   - `TEST_OTP_CODE=123456` - přihlašovací kód bude vždycky tenhle a na
     obrazovce kódu se ukáže banner „Testovací režim: kód je 123456".
   - (volitelně) `OTP_DEV_PREVIEW=1` - /dev/kredit umí rychlé přihlášení.
2. Otevři `/prihlaseni`, zadej svůj e-mail, opiš kód z banneru.
3. Jdi na `/cenik` a kup balíček - platba jde přes Stripe **test mode**,
   použij kartu `4242 4242 4242 4242`, libovolnou budoucí expiraci a CVC.
   Když platba selže, uvidíš viditelnou chybu pod tlačítkem (nic se
   nestrhne).
4. Zůstatek zkontroluješ na `/profil` nebo na `/dev/kredit`.
5. Polož otázku na homepage - checkout ti nabídne čerpání z balíčku.

**Co na produkci nesmí existovat (a build to hlídá):** `TEST_OTP_CODE`,
`OTP_DEV_PREVIEW`, jakákoli `/dev/*` stránka (vrací 404) - pokud nejsou
vědomě odemknuté (viz níže).

### Testování přímo na produkční doméně (např. tarotolasce.vercel.app)

Pokud nemáš samostatný preview deploy a chceš `/dev/kredit` vyzkoušet
rovnou na produkční doméně, nastav ve Vercelu (Project Settings →
Environment Variables, scope **Production**):

```
ALLOW_DEV_TOOLS=1
TEST_OTP_CODE=123456      # volitelné, ať nemusíš číst e-mail
OTP_DEV_PREVIEW=1         # volitelné, /dev/kredit pak umí rychlé přihlášení
```

Po uložení redeployni (Vercel → Deployments → „Redeploy" na poslední
commit, nebo push nový commit). Build teď při `ALLOW_DEV_TOOLS=1`
nespadne, ale vypíše ve stavu buildu žluté varování, že `/dev/*` je na
produkci veřejně dostupné - to je záměr, ne chyba.

**Po dotestování všechny tři proměnné z Vercelu smaž a znovu redeployni**,
ať `/dev/*` na produkci zase zmizí (404) pro běžné návštěvnice.
