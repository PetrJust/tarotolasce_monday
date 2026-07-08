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
