# PŘEDÁVACÍ DOKUMENT — Tarot o Lásce, implementace zadání v1.1 FINAL

> Stav ke dni 5. 7. 2026 (session 2: TODO 1-11 HOTOVÉ). Autor: vibecoding
> session (Claude + Petr).
> Zdroj pravdy pro požadavky: `tarotolasce-zadani-vibecoding-v1-1-FINAL__2_.md`
> (v uploads; NAHRAZUJE draft v1.1 i GPT dokument; v1 platí, kde ho v1.1 nemění).
> Tento dokument popisuje, CO je hotové, CO rozpracované, JAK pokračovat a ČÍM to ověřit.


---

# AKTUALIZACE: session 3 - zadání v1.3 FINAL ZPRACOVÁNO CELÉ

Platné dokumenty: v1 + v1.1 FINAL + **v1.3 FINAL** (nahrazuje v1.2 celý).
Všechny body v1.3 §1-§8 jsou nasazené:

**§1 CTA:** gradient zrušen VŠUDE (i rub karet, Stories canvas, OG obrázek
- teď ploché noční); `bg-love`, `coral-400`, `shadow-glow` neexistují.
Primární CTA = třída `.btn-primary` v globals.css (plum-900 #3B1D42, bílý
text, radius 22, váha 700, min-height 64 na mobilu, decentní stín
`shadow-cta`). Disabled = `#6E5F72` (tokens.plumDisabled, AA 5.6:1) +
na obrazovce otázky text „Nejdřív napiš otázku". Invariant 3 přepsán
v lib/palette.ts. Právě jedna primární na obrazovku (na ceníku ji nese
karta „První výklad", BuyPack má prop `primary`).

**§2 Font:** Lora nasazená jako --font-display (latin-ext, swap, váhy
500/600/700); Inter beze změny. Logo = --font-logo (Fraunces 600,
současný řez) - jediná výjimka, Fraunces vs. Lora 600 rozhodne zakladatel
pohledem; po rozhodnutí pro Loru smazat import v layout.tsx a v Headeru
přepnout na font-display. Tlačítka 700 (globals.css).

**§3 Copy (vše DOSLOVA):** hero „Co ti teď běží hlavou?" + podtext + garance
pod CTA; chipy z JEDNÉ definice lib/chips.ts (homepage i flow); obrazovka
otázky s disabled textem „Nejdřív napiš otázku" → „Pokračovat ke kartám"
(přechod funguje, řízeno stavem otázky); Jak to funguje = components/
HowItWorks.tsx, tři SVG ilustrace ve stylu rubů + věty doslova + garance;
ukázky 3.4 doslova v SampleReadings.tsx (1+2, včetně pomlčky - schváleno
zakladatelem); karta dne bez „pro tvoje srdce"; FAQ = akordeon <details>,
3 otázky SBALENÉ, budoucnost doslova (první dvě odpovědi zjednodušené =
NÁVRH, plné znění „sloučení" nedodáno); checkout „Ještě jeden krok ke
kartám." + podtext + CTA „Zaplatit a pokračovat ke kartám"; před mícháním
věta o klidu doslova (bez jména), podtext „Nehledej správnou…" doplněn;
OTP nadpis „Zadej kód z e-mailu" + chyba doslova (i u opt-inu karty dne);
Spirio most doslova (obě varianty). Pravidlo frekvence jména: Nomi jen na
dotykových bodech (title/meta, hero, FAQ, patička, podpis, e-maily, badge
v headeru, disclosure na kartě dne); z těl sekcí odstraněna (loading,
feedback, SEO texty, checkout poznámka, míchání).

**§4 Ceník:** 4 karty (První 29 / 1×49 / 5×199 / 20×599), žádné „Brzy",
balíčky nakupují přes /api/checkout (ledger), první dvě karty vedou do
checkout flow. Grid 2/4 sloupce, ceny lining-nums.

**§5 Dev/test:** /dev/* gate přes `VERCEL_ENV === "production"` → notFound;
TEST_OTP_CODE akceptovaný jen mimo produkci (lib/account.overrideOtpCode
přepíše hash aktivního OTP; limity platí dál) + banner „Testovací režim:
kód je …" na obrazovce kódu; scripts/deploy-check.mjs běží před `next
build` a na produkci shodí build, když existuje TEST_OTP_CODE /
OTP_DEV_PREVIEW / chybí gate; testovací instrukce v README (Stripe test
karta 4242…).

**§6 Bugy:** nav session FIXNUTO - useSession se znovu načítá při změně
pathname + event „tol-session-changed" (announceSessionChange volá
přihlášení i /dev/kredit); GPay = brandovaný černý badge
components/GooglePayButton.tsx (v produkci nahradí Stripe Express
Checkout Element - komentář v kódu).

**§7 Zrušené:** gradient, coral-400, /dev/font, „Nomi na tebe čeká",
hero hook „Když tě něco v lásce tíží…" - grep čistý.

**§8 Akceptace:** golden set rozšířen o pravidlo dikce 9 (zákaz „pro tvoje
srdce" apod.) a přeměřen headless: 21/21 průchodů jádra + dikce; 92
souborů parsuje; jediné zbývající = reálné zařízení (Lora diakritika,
lámání H1, vějíř) a rozhodnutí zakladatele (logo font, FAQ odpovědi 1-2,
Stripe test mode end-to-end na skutečném preview).

---

## 1. Projekt v kostce

- **Produkt:** tarotolasce.cz — AI tarot o lásce pro ženy 22–40, persona „Nomi"
  (AI kartářka). Hybrid se spirio.cz (živé průvodkyně, most po výkladu).
- **Stack:** Next.js 14 App Router, TypeScript, Tailwind, Framer Motion.
  Vše datové je **MOCK** (soubor `.data/`), produkční náhrady označeny
  `// MOCK: replace with production` v kódu + `schema.sql` pro PostgreSQL.
- **Deploy:** GitHub `PetrJust/tarotolasce` (soubory v KOŘENI repa) → Vercel
  (Framework Preset: Next.js). Postup výměny: **vyprázdnit repo kromě `.git`
  → rozbalit `tarotolasce-root.zip` → commit → push.** Nikdy nerozbalovat
  přes staré soubory (duplicitní stránky = build fail).
- **Kritická pravidla (invarianty v1.1):** jediný gradient v aplikaci
  (rose→coral, jen primární CTA + max 1 dekor hero); jméno persony jen přes
  `lib/persona.ts`; „Nomi AI" zakázáno všude; žádný spec jazyk v UI
  („ledger", „OTP", „server-side"); copy se nemění bez položky v zadání;
  žádné dlouhé pomlčky (—) v textech; české uvozovky „ ".

## 2. Klíčové soubory a obnova prostředí

- Projekt: `/home/claude/tarotolasce` (kontejner se resetuje!).
  Obnova: `cd /home/claude && mkdir tarotolasce && unzip -q /mnt/user-data/outputs/tarotolasce-root.zip -d tarotolasce`
  (POZOR: zip má soubory v kořeni, ne ve složce).
- Výstupy: `/mnt/user-data/outputs/tarotolasce-root.zip` (aktuální stav),
  `karty-prejmenovani.zip` (OCR nástroj na přejmenování fotek karet),
  `nazvy-karet.txt` (checklist 78 slugů pro `/public/cards/{slug}.webp`).
- Zadání: `/mnt/user-data/uploads/tarotolasce-zadani-vibecoding-v1-1-FINAL__2_.md`
  (+ starší v1 a paleta-a-kontrast tamtéž).
- Sandbox nemá `node_modules` → typecheck přes `require('typescript')`
  (transpile/parse), testy headless (viz §7). `tailwindcss` type error
  v configu je šum sandboxu, na Vercelu zmizí.

## 3. Architektura po v1.1 (co je nové)

### Backend (mock, ale s produkční logikou)
- **`lib/account.ts`** — účty, **append-only ledger** (zůstatek = SUM(delta),
  idempotence přes unikátní `ref`), transakční čerpání (in-process mutex),
  intro-jednou-na-účet, **OTP** (sha256 hash, TTL 10 min, jednorázovost,
  nový invaliduje starý, 5 pokusů → zámek 15 min, resend 60 s, rate limit
  5/hod adresa + 15/hod IP, identická odpověď pro ne/existující e-mail),
  **sessions** (httpOnly cookie `tol_session`). Store: `.data/account.json`,
  pro testy `TOL_DATA_DIR`. Produkce: tabulky v `schema.sql`.
- **`lib/email.ts`** — provider-agnostic: Resend při `RESEND_API_KEY`,
  jinak mock (console + `.data/outbox.json`). `sendOtpEmail` (kód
  V PŘEDMĚTU), `sendPurchaseEmail` (trvalý odkaz, BEZ login linku, věta
  „Ke svému účtu se kdykoli přihlásíš kódem"). Odesílatel z `lib/persona.ts`.
- **API:** `/api/auth/otp/request` (devCode jen při `OTP_DEV_PREVIEW=1`
  mimo produkci), `/api/auth/otp/verify` (session cookie; purpose
  `daily_card_optin` bez session), `/api/auth/session` GET/DELETE,
  `/api/credits` (session → balance). **`/api/auth/magiclink` SMAZÁN.**
- **`/api/checkout`** — ceny SERVER-SIDE (mapa PRODUCTS), intro podruhé →
  `409 {error:"intro_used", useSingle:true}`, balíček bez session →
  `401 login_required`, připsání kreditu idempotentní (`creditPurchase`),
  `fail@` v e-mailu simuluje selhání platby.
- **`/api/reading/stream`** — `useCredit: true` v body → session +
  `consumeCredit` (402 při nule; idempotentní na sessionId, refresh
  nestrhne dvakrát); po uložení výkladu posílá e-mail s trvalým odkazem.
- **`/api/readings`** — jen přes session (žádný přístup jen e-mailem).
- **`lib/flags.ts`** — kredity defaultně ZAPNUTÉ (`NEXT_PUBLIC_ENABLE_CREDITS
  !== "0"`), dev override cookie přes `/dev/kredit` zůstává.
- **`app/dev/layout.tsx`** — v produkci `notFound()` bez `ALLOW_DEV_TOOLS=1` (H.5).

### Design vrstva
- **`lib/persona.ts`** — PERSONA_NAME/FULL/BRAND, EMAIL_SENDER.
- **`lib/palette.ts`** — tokens v1.1 §C: plum900 `#3B1D42`, blush50
  `#FDF1F7`, **rose500 `#EC5CA8`** (doladěno z `#E8489B` v rámci ±1 odstínu,
  aby plum text na PLOCHÉ rose dal AA 4.63; gradient s plum: 4.63/6.50),
  rose700 `#B81E76` (odkazy, 5.48 na blush), coral400 `#FF8E72` (jen konec
  gradientu), gold600 `#B8912F` (jen mystické motivy). `loveGradient()`,
  `NIGHT_GRADIENT` (Stories/OG), `contrastRatio`/`meetsAA`.
- **`tailwind.config.ts`** — plum/blush/rose/coral/gold(jen 600)/night/cream;
  `bg-love` = jediný gradient; glow z rose.
- **`app/globals.css`** — PLOCHÁ blush-50 na body (žádný gradient pozadí),
  CSS proměnné (--accent=rose500, --accent-soft=rose700 pro odkazy,
  --text-dim=plum 72 %), sémantické třídy `bg-surface/text-body/text-accent…`,
  typografie §D: `h1.font-display` clamp 36–44 ř. 1.1 text-wrap:balance,
  h2 28–34, body 17px/1.6, button 600, `.lining-nums-price`,
  `.tabular-nums-count`.
- **`app/layout.tsx`** — **Fraunces** (500/600, latin-ext, swap) + Inter
  (latin-ext, swap).

### UI (nové/přepsané v této session)
- `app/prihlaseni/page.tsx` — OTP dle B.1 PŘESNĚ (2 obrazovky, copy doslova,
  odpočet „Poslat znovu · 0:42" tabular-nums, chybové stavy, zámek,
  „upravit adresu", našeptávač domén, dev náhled kódu).
- `components/OtpInput.tsx` — 6 polí, paste celého kódu, auto-posun,
  numeric, one-time-code, auto-submit po 6. číslici.
- `components/Header.tsx` — hamburger (Ceník+Historie na mobilu), session
  stav Profil/Přihlásit se (F.3, fix H.1), persona konstanta.
- `components/CreditBadge.tsx`, `components/BuyPack.tsx` — čtou serverový
  ledger; nákup balíčku vyžaduje přihlášení (jinak vede na /prihlaseni);
  „Položit otázku" a „Koupit balíček" = gradient (mapa C pro ceník).
- `app/profil/page.tsx`, `app/historie/page.tsx` — session-based; historie:
  celá karta klikací (F.9), prázdný stav (NÁVRH, GPT bod 15 nedodán).
- `lib/useSession.ts`, `lib/emailSuggest.ts` — sdílené.
- Stabilizační fixy: TarotCard/canvas/OG na `tokens.gold600`; karta-dne
  opt-in volá `/api/auth/otp/request` (plné zadání kódu = TODO níže);
  ReadingStream: kurzor mizí okamžitě při `event: done` (H.3 hotovo);
  Footer: „ani krizovou pomoc" + třídy bez gold-soft (F.8 hotovo).

## 4. Matice plnění v1.1 (stav podle sekcí)

| Sekce | Stav | Poznámka |
|---|---|---|
| A ledger + balíčky | **HOTOVO (mock)** | akceptační testy prošly headless; checkout flow v UI přepojen na server (dřívější TODO 2) |
| B.1 obrazovky OTP | **HOTOVO** | copy doslova dle zadání |
| B.2 server OTP | **HOTOVO (mock)** | |
| B.3 důsledky | **HOTOVO** | denní karta má double opt-in KÓDEM (OtpInput + verify purpose daily_card_optin) |
| C tokens + hierarchie | **HOTOVO** | class sweep proveden (grep starých tříd = 0 mimo Footer/CrisisScreen); gradient mapa ověřena |
| D typografie | **HOTOVO** | reálné zařízení = checklist |
| E vějíř | **HOTOVO (kód)** | radiální kolo: střed pod hranou (cy = výška + 110), r 300–340, snap + setrvačnost (decay 0,95), haptika 3/12, klávesnice, reduced-motion fade; finální doladění kroku/hrany + 60 fps = reálné zařízení |
| F.1–F.5 landing | **HOTOVO** | pořadí hero → jak to funguje → ukázky → karta dne → FAQ; H1 hook + chipy PŘESNĚ; SampleReadings 1+2 (texty NÁVRH) |
| F.3 header/nav | **HOTOVO** | |
| F.6 před mícháním | **HOTOVO** | intro copy PŘESNĚ + nenápadný zvukový přepínač |
| F.7 po výkladu | **HOTOVO** | cesta 1 gradient „Chceš se zeptat ještě na něco?" + cena pod; Otevřít historii plochá rose; trvalý odkaz ztlumen; Spirio copy verbatim v1 (NÁVRH flag) |
| F.8 footer | **HOTOVO** | |
| F.9 historie | **HOTOVO** | prázdný stav = NÁVRH |
| G dikce + ukázky | **HOTOVO (NÁVRH)** | SAMPLE_* přepsané v dikci G; cardBlock 2–3 věty s vazbou na otázku; ano/ne směr 2× |
| H.1–H.5 | **HOTOVO** | H.2: spec jazyk zbývá jen v /dev (gated H.5) |
| I e-mail infra | **HOTOVO (kód)** | DNS + doručitelnost = ruční |
| J checklist | průběžně | reálné zařízení: vějíř 60 fps, 2 swipy na 78, typografie |

## 5. PRIORITIZOVANÉ TODO (pokračování příště)

TODO 1–11 z předchozí verze jsou HOTOVÉ (viz matice §4). Zbývá:

**TODO A — reálné zařízení (checklist E + D + J):** vějíř 60 fps, 2 dlouhé
swipy projedou 78 karet, hrana 22–26 px (doladit `stepDeg`/`radius`
v `components/Ritual.tsx`), haptika, typografie Fraunces/Inter.

**TODO B — schválení NÁVRHŮ zakladatelem (viz §9)** a případný přepis textů.

**TODO C — produkce:** Stripe checkout+webhook místo mock `/api/checkout`
(logika `creditPurchase` zůstává), PostgreSQL dle `schema.sql`, Resend
(`RESEND_API_KEY`), DNS SPF/DKIM/DMARC, `OTP_DEV_PREVIEW` vypnout.

**TODO D — golden set ve vitest:** lokálně `npx vitest run` (headless
v sandboxu prošel 42/42 vč. nových pravidel dikce G).

## 6. Env proměnné

| Proměnná | Význam | Default |
|---|---|---|
| `NEXT_PUBLIC_ENABLE_CREDITS` | `"0"` vypne balíčky (jinak zapnuto) | zapnuto |
| `OTP_DEV_PREVIEW` | `"1"` = devCode v odpovědi requestu (jen mimo produkci) | vypnuto |
| `ALLOW_DEV_TOOLS` | `"1"` = /dev/* i v produkci | vypnuto |
| `RESEND_API_KEY` | zapne reálné odesílání přes Resend | mock |
| `TOL_DATA_DIR` | umístění mock store (testy) | `.data/` |
| `NEXT_PUBLIC_INTRO_PRICE_CZK` | intro cena (A/B 29/19) | 29 |
| `NEXT_PUBLIC_OPERATOR(_ICO)`, `NEXT_PUBLIC_CONTACT_EMAIL` | patička/kontakt | SpirioTech s.r.o. |

## 7. Testy (headless postup, ověřeno)

```bash
# 1) transpile lib/account.ts -> /tmp/lt/account.js přes require('typescript')
# 2) TOL_DATA_DIR=/tmp/... node skript s asserty
# V této session prošlo 10/10: A.1 SUM/řádky, A.2 odmítnutí při 0 (server),
# A.1b idempotentní čerpání (refresh nestrhne 2x), A.3 kredit vázaný na
# účet (case-insensitive e-mail), A.4 dvojitý webhook 1x, A.5 intro jednou,
# A.6 identická odpověď + resend 60 s, B jednorázovost+session, B zámek po
# 5 pokusech, B rate limit 5/hod.
```
`tests/ledger.test.ts` a `tests/golden.test.ts` jsou i ve vitest formátu
pro lokální `npx vitest run` u Petra. Golden (engine v2, 9 kontrol)
prošel dřív; po TODO 9 znovu spustit.

## 8. Ověřovací příkazy před každým zipem

```bash
grep -rn "—" app components lib --include="*.tsx" --include="*.ts"   # 0
grep -rn "Nomi AI" app components lib                                 # 0
grep -rnE "ledger|OTP|server-side" app components --include="*.tsx" \
  | grep -v "^.*//"   # spec jazyk jen v komentářích, ne v UI stringách
grep -rn "bg-love" app components   # jen mapovaná primární CTA
grep -rnE "bg-gold|text-gold|border-gold|text-night|ring-gold" app components \
  --include="*.tsx" | grep -v "Footer\|CrisisScreen\|gold-600\|gold600"  # 0 po TODO 1
node …parse+balance… (vzor v historii chatu)
rm -rf .data && zip -rq /mnt/user-data/outputs/tarotolasce-root.zip . \
  -x "node_modules/*" ".next/*" ".data/*" ".git/*"
```

## 9. Copy čekající na schválení zakladatelem (NÁVRH)

1. G.3 texty ukázek (zadání je samo označuje NÁVRH).
2. Zkrácené „Jak to funguje" (GPT bod 5 nedodán).
3. „Jemnější" Spirio copy (GPT nedodán) — zatím verbatim v1 §7.6.
4. Prázdný stav historie (GPT bod 15 nedodán) — implementován můj návrh.
5. Přepsané engine SAMPLE_* v dikci G (po TODO 9).

## 10. Známé pasti a poučení

- **Repo výměna:** vždy vyprázdnit (kromě `.git`) před rozbalením.
- Python heredoc v bashi kdysi rozbil UTF-8 → české texty zapisovat přes
  `python3` s explicit `encoding="utf-8"` (dělá se tak všude).
- `str_replace` vyžaduje čerstvý `view` téhož souboru.
- Tailwind: neexistující třída NEHLÁSÍ chybu, jen se nevykreslí → po změně
  palety vždy sweep + grep (proto TODO 1 kritické).
- `grep -c` s 0 shodami vrací exit 1 — není to chyba.
- Krizové obrazovky (`CrisisScreen`) a Footer se NIKDY nerestylují do
  světla — vlastní night/cream, mimo scope (K).
