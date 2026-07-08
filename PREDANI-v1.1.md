# PŘEDÁVACÍ DOKUMENT — Tarot o Lásce, implementace zadání v1.1 FINAL

> Stav ke dni 5. 7. 2026. Autor: vibecoding session (Claude + Petr).
> Zdroj pravdy pro požadavky: `tarotolasce-zadani-vibecoding-v1-1-FINAL__2_.md`
> (v uploads; NAHRAZUJE draft v1.1 i GPT dokument; v1 platí, kde ho v1.1 nemění).
> Tento dokument popisuje, CO je hotové, CO rozpracované, JAK pokračovat a ČÍM to ověřit.

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

### Logo (dodané zakladatelem)
- `public/logo-main.png` (504x145, PRŮHLEDNÉ PNG, s taglinem „Porozumět
  lásce. Porozumět sobě.") — hero na landingu; `public/logo-wordmark.png`
  (~496x78, ořez nápisu) — hlavička. Průhledné pozadí = funguje na
  libovolném světlém podkladu. Zdroj: uploads/main.png (2. verze).
  Zdroj je 504 px široký — nezvětšovat nad 1x (rozmazání); pro retinu
  časem požádat Romana o 2x export.

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
| A ledger + balíčky | **HOTOVO (mock)** | 6 akceptačních testů prošlo headless (viz §7). Stripe = mock; produkce vymění `/api/checkout` za Stripe checkout+webhook, logika `creditPurchase` zůstává. |
| B.1 obrazovky OTP | **HOTOVO** | copy doslova dle zadání |
| B.2 server OTP | **HOTOVO (mock)** | testy: jednorázovost, zámek, rate limity, identická odpověď |
| B.3 důsledky | **ČÁSTEČNĚ** | purchase e-mail bez login linku ✓; denní karta: request kódu ✓, ale **zadání kódu (OtpInput) v karta-dne chybí** — TODO 8; dev magic-link tlačítko zrušeno ✓ |
| C tokens + hierarchie | **ČÁSTEČNĚ** | tokens/config/globals ✓; **CLASS SWEEP zbývá** (TODO 1 — kritické); gradient mapování hotové jen pro ceník+přihlášení |
| D typografie | **HOTOVO** | Fraunces+Inter latin-ext swap, velikosti, lining/tabular nums; reálné zařízení = checklist |
| E vějíř | **NEZAČATO** | TODO 4 (parametry níže) |
| F.1–F.5 landing | **NEZAČATO** | TODO 5 |
| F.3 header/nav | **HOTOVO** | |
| F.6 před mícháním | **NEZAČATO** | TODO 4 (spolu s Ritual) |
| F.7 po výkladu | **NEZAČATO** | TODO 6 |
| F.8 footer | **HOTOVO** | |
| F.9 historie | **HOTOVO** | prázdný stav = NÁVRH |
| G dikce + ukázky | **NEZAČATO** | TODO 9 (engine přepsat!) |
| H.1 nav | **HOTOVO** | |
| H.2 spec jazyk | **ČÁSTEČNĚE** | profil/ceník ✓; po sweepu projet grep (TODO 13) |
| H.3 kurzor | **HOTOVO** | fix přímo ve větvi `event: done` |
| H.4 bloky 2–3 věty | **NEZAČATO** | TODO 9 |
| H.5 dev gate | **HOTOVO** | |
| I e-mail infra | **HOTOVO (kód)** | DNS SPF/DKIM/DMARC + test doručitelnosti = ruční, mimo sandbox |
| J checklist | průběžně | viz §8 |

## 5. PRIORITIZOVANÉ TODO (pokračování příště, v tomto pořadí)

**TODO 1 — CLASS SWEEP (kritické, jinak vizuálně rozbité!).** Tailwind už
nemá `gold.DEFAULT/soft/dim` ani se nepoužívá tmavé pozadí, ale řada
souborů dál používá staré třídy → negenerují CSS. Mapping (regex, pořadí
delší→kratší): `hover:bg-gold-soft`→`hover:opacity-90`; `bg-gold`→
`bg-rose-500`; `text-night-deep|text-night`→`text-plum-900`;
`text-gold-soft|text-gold`→`text-accent-soft` (odkazy) nebo `text-accent`;
`border-gold-dim`→`border-accent-dim`; `border-gold|hover:border-gold`→
`border-accent`; `ring-gold`→`ring-rose-500`. **VYNECHAT** `components/Footer.tsx`
a `components/CrisisScreen.tsx` (night/cream úmyslně). Zasažené soubory:
QuestionBox, Ritual, ThreePaths, SpirioCTA, ReadingFeedback, ReadingStream
(tečky/kurzor bg-gold→bg-rose-500), app/vyklad/novy, app/vyklad/[id],
cenik, karta-dne, not-found, legal stránky, dev stránky. Ověřit: grep na
staré třídy = 0 mimo Footer/CrisisScreen.

**TODO 2 — checkout flow na server ledger** (`app/vyklad/novy/page.tsx`):
(a) kredity číst z `/api/credits`, ne z cookie `getCredits()`;
(b) do `<ReadingStream>` přidat prop `useCredit` a v komponentě ho poslat
v body fetchi; (c) `pay()`: na `409 intro_used` automaticky zopakovat
nákup se `price_single_49` (a přepnout zobrazenou cenu); (d) „Zaplatit
kartou" → `bg-love text-plum-900` (primár checkoutu dle mapy C), Apple/Google
zůstávají brandované; (e) cena `.lining-nums-price`; (f) headline už je
„{PERSONA_NAME} na tebe čeká." — jen ověřit import persony.

**TODO 3 — jediný gradient (invariant 3):** po TODO 1 zkontrolovat, že
`bg-love` je JEN na: homepage submit (QuestionBox), ceník CTA, checkout
platba, „Zamíchat karty", „Otočit karty", ThreePaths cesta 1, „Poslat kód".
**Spirio proužek `from-[#3B0764] to-[#BE185D]` v SpirioCTA/ThreePaths je
gradient → nahradit plochou linkou `bg-rose-500`** (invariant vítězí nad
starším „podpisovým" gradientem). Dárek v ThreePaths → plochá rose-500.

**TODO 4 — Ritual: F.6 + E vějíř.** F.6 intro copy PŘESNĚ: „Na chvíli se
zastav. Zůstaň u své otázky. Až budeš připravená, Nomi zamíchá karty."
(persona konstantou) + nenápadný zvukový přepínač (hook `useShuffleSound`
existuje). Vějíř E — radiální kolo: střed POD spodní hranou (cy = výška
kontejneru + ~110 px), poloměr r ≈ 300–340 (podle šířky), krok ~5–6,5°
(vyladit na viditelnou hranu 22–26 px: hrana ≈ r·krok_rad), viditelných
~15 v okně ~120°, tečné natočení (rotate = úhel), prostřední karta:
posun po normále +12 px, scale 1.12, obrys rose-500, JEDINÁ vybratelná
(min. 44×44 px cíl). Drag: rotace += dx·k (k≈0,35°/px) + setrvačnost
(decay ~0,95/frame) + snap na násobek kroku; tap mimo střed = dorolování
na kartu; tap na střed = výběr + let do slotu (Framer). Haptika:
`navigator.vibrate?.(3)` při snapu, `(12)` při výběru. `prefers-reduced-motion`
= fade bez letu. Klávesnice: šipky = krok, Enter = výběr. Zachovat API
`pick(i)` na server (i = logický index balíčku = focusIndex mod 78).
Akceptace (2 dlouhé swipy na 78, 60 fps) = reálné zařízení.

**TODO 5 — Landing F.1/F.2/F.4/F.5** (`app/(light)/page.tsx`):
pořadí hero → jak to funguje → ukázky → karta dne (přesunout POD ukázky)
→ FAQ (3) → footer. Hero: H1 hook „Když tě něco v lásce tíží, zeptej se
Nomi." + věta „…a Nomi, tvoje AI kartářka, ti je osobně vyloží."
(persona konstantou; plná forma hned v představení = ochranný režim).
Chipy PŘESNĚ a v pořadí: „Myslí na mě můj ex?" · „Ozve se ještě?" ·
„Mám čekat?" · „Co ke mně cítí?" (v `components/QuestionBox.tsx`).
„Jak to funguje" zkrátit (GPT bod 5 NEDODÁN → NÁVRH, označit v kódu).
Ukázky: nová klientská komponenta `SampleReadings.tsx` — 1 rozbalená
+ 2 sbalené (štítek + otázka + první věta + „zobrazit víc"), texty G.3
DOSLOVA (v zadání; samy jsou NÁVRH ke schválení zakladatelem).

**TODO 6 — F.7 po výkladu** (`components/ThreePaths.tsx`, `app/vyklad/[id]`):
cesta 1 = primární gradient tlačítko „Chceš se zeptat ještě na něco?"
s cenou drobně pod (49 Kč / z balíčku); Spirio most: struktura beze změny,
„jemnější copy dle GPT" NEDODÁNO → nechat verbatim z v1 + flag NÁVRH;
u uloženého výkladu „Otevřít historii" primární (plochá rose), trvalý
odkaz ztlumit (text-body-dim), neodstraňovat.

**TODO 7 — dev nástroje dorovnat:** `/dev/kredit` dnes simuluje kredit
v cookie → přepojit na server (tlačítka: rychlé přihlášení přes OTP
devCode, nákup balíčku přes `/api/checkout`, zobrazení `/api/credits`).
`/dev/emails`: šablonu magic linku nahradit OTP šablonou (kód v předmětu)
a purchase šablonou bez login linku (číst klidně z `.data/outbox.json`).

**TODO 8 — denní karta double opt-in kódem (B.3):** v
`app/(light)/karta-dne/page.tsx` po odeslání e-mailu zobrazit `OtpInput`
a volat `/api/auth/otp/verify` s `purpose:"daily_card_optin"`; teprve po
ověření hláška o aktivaci. (Request už na OTP jede.)

**TODO 9 — dikce G + engine** (`lib/mockReadings.ts`): SIGNATURE přes
`PERSONA_NAME`; PŘEPSAT SAMPLE_* (obsahují zakázané vzory „Nevyřčená
zůstala…", „v poháru až po okraj"!) ve stylu G.3 — krátké věty, karetní
obraz + lidský překlad v téže větě, žádné inverze/vibrace/vesmír/
vykřičníky/zdrobněliny (NÁVRH ke schválení). `cardBlock` → 2–3 věty
s vazbou na otázku (H.4): přidat druhou větu odkazující na téma otázky.
Ano/ne: směr zopakovat i v závěru (checklist: „ne jen v úvodu").

**TODO 10 — golden set rozšířit** (`tests/golden.test.ts`): pravidla
dikce (zákaz „vibrace", „vesmír", „!", inverzní vzory), délka bloku
≥2 věty, vazba na otázku, směr u ano/ne 2×. Spustit headless (viz §7).

**TODO 11 — persona sweep zbytku UI:** hero, karta-dne texty, FAQ,
checkout — „Nomi" přes konstantu; grep `Nomi AI` musí být 0.

**TODO 12 — finální kontroly + zip** (viz §8) a v odpovědi uvést stav
checklistu J.

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
