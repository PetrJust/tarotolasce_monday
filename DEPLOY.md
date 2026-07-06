# Nasazení na Webglobe (tarotolasce.cz)

Tahle aplikace je **Next.js 14 / Node.js** server, ne statický web. Potřebuje
**aplikační hosting s Node.js** (ne klasický PHP/WordPress webhosting).

## 0. Co si objednat

U Webglobe **aplikační hosting / aplikační server s Node.js**. Pokud si nejsi
jistý položkou, napiš jejich podpoře:

> Mám u vás doménu tarotolasce.cz a potřebuji provozovat aplikaci na
> Next.js 14 / Node.js 20, spouštěnou jako `npm run start`, se SSH přístupem
> a PostgreSQL databází. Který tarif je správný?

Požadavky na službu: Node.js 18+ (ideálně 20), SSH přístup, dlouho běžící
proces (Webglobe řeší supervisorem), PostgreSQL, SSL.

## 1. Příprava prostředí (proměnné)

V panelu hostingu (nebo v souboru `.env.local` na serveru) nastav:

```
NEXT_PUBLIC_SITE_URL=https://tarotolasce.cz
DATABASE_URL=postgres://uzivatel:heslo@host:5432/databaze
PGSSL=require          # jen pokud DB server vyžaduje SSL
```

- Bez `DATABASE_URL` aplikace běží na souborovém úložišti (`.data/`), což stačí
  na vyzkoušení, ale pro ostrý provoz nastav PostgreSQL.
- Tabulky se vytvoří samy při prvním připojení. Ručně je lze založit z
  `schema.sql`.

## 2. Nahrání kódu (SSH / Git)

Nahraj projekt **bez** `node_modules`, `.next` a `.data`. Buď přes Git
(doporučeno), nebo nahráním souborů.

```bash
# na serveru, ve složce aplikace:
npm install
npm run build
```

## 3. Spuštění

```bash
npm run start        # spustí Next.js na portu 3000 (nebo dle PORT)
```

Webglobe drží proces přes **supervisord** (restart po pádu i po restartu
serveru). V panelu nastav spouštěcí příkaz `npm run start` a pracovní adresář
projektu. Pokud panel vyžaduje konkrétní port, nastav proměnnou `PORT`
a aplikace ho použije automaticky (Next.js respektuje `PORT`).

## 4. Doména a SSL

- Naviguj `tarotolasce.cz` (a `www`) na běžící Node aplikaci podle panelu
  Webglobe (typicky nastavení domény na aplikaci/port).
- Zapni SSL certifikát (Let's Encrypt, většinou jedním klikem).
- `NEXT_PUBLIC_SITE_URL` musí odpovídat ostré doméně, jinak budou špatně
  canonical odkazy a sitemap.

## 5. Po nasazení zkontroluj

- Úvodní stránka se načte přes https.
- Projde celý tok: otázka → platba (mock) → rituál → výklad → historie.
- `tarotolasce.cz/sitemap.xml` a `tarotolasce.cz/robots.txt` vrací správnou
  doménu.
- Výklady se ukládají (historie přežije i po restartu aplikace = DB funguje).

## Co ještě zbývá dořešit pro plný ostrý provoz

Tyto věci jsou zatím v **mock** režimu a před spuštěním placené verze je
potřeba napojit (jsou označené `// MOCK: replace with production`):

1. **Platby (Stripe).** Teď platba vždy uspěje. Důležité: výklad se generuje
   bez ověření platby. Po napojení Stripe musí endpoint `/api/reading/stream`
   ověřit zaplacení (např. přes webhook / payment intent), než výklad vydá.
2. **Moderace a klasifikace** otázek (teď keyword pravidla → produkční model).
3. **Generování výkladu** (teď předpřipravené texty → vlastní AI model).
4. **Odesílání e-mailů** (teď se nikam neposílají; šablony viz `/dev/emails`).
5. **Přihlášení** (teď mock magic link).
6. **Právní stránky** a údaje provozovatele (značky `TODO` / `{TODO}`).
7. **Obsah karet** v knihovně (5 z 78 hotovo, zbytek `TODO_CONTENT`).
