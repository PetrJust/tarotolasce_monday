# Tarot o Lásce — balíček k předání týmu (příloha k zadání v1.6)

Tenhle list řeší jediné: **co fyzicky poslat vývojářskému týmu, aby jim nic nechybělo a nepoužili nic, co ještě nesmí.** Zadání v1.6 se odkazuje na „přiložené assety" — ty jsou přiložené do naší konverzace, ne k dokumentu, takže je musíš přibalit ručně. Bez toho tým buď zastaví (dostal pravidlo „u rozporu zapiš KONFLIKT a zastav se"), nebo si dokreslí vlastní srdce.

## Co poslat — přesně tyhle položky

**1. Zadání (povinné, hlavní dokument)**
- `tarotolasce-zadani-v1-6-FINAL.md` — jediné platné zadání. Všechno starší je neplatné, neposílat.

**2. Logo assety — HOTOVÉ, nasadit (přibalit jako soubory)**
| soubor | co to je | rozměr | stav |
|---|---|---|---|
| `symbol.svg` | karta se srdcem — hlavní symbol | 120×168 | ✅ tokens v3 čisté, nasadit |
| `rub-karty.svg` | rub se srdcem — nahrazuje hvězdový rub | 200×320 | ✅ tokens v3 čisté, nasadit |
| `favicon-16.svg` | favicon | 16×16 | ✅ tokens v3 čisté, nasadit |

Barevný audit všech tří: obsahují výhradně `#2B1340` (deep-plum) a `#D4AF37` (soft-gold) — nula starých hexů. **Kde nasadit rub se srdcem:** vějíř, karta dne, Stories export, ilustrace — všude, kde je dnes hvězdový rub (zadání v1.6 sekce 3 a 8).

## Co ještě NEEXISTUJE — musí se dodat, než bude launch kompletní

Tyhle assety zadání vyžaduje, ale v přiložených souborech nejsou. Nejsou blokerem launche appky samotné, ale blokují OG náhledy, sociální profily a Stories:

- **Wordmark „Tarot o Lásce" jako SVG** — `[POZOR]` pokud existuje starší soubor, musí být **přesazený do fonta Lora** (zadání ruší Fraunces). Wordmark v jiném fontu tým NESMÍ použít, dokud se nepřevede. Pokud wordmark jako soubor neexistuje vůbec: v hlavičce appky se vykresluje textem v Loře přímo z kódu (to je v pořádku, řešit netřeba); potřeba je jen pro Stories/OG/avatar.
- **Ikona 512×512** (budoucí PWA, app ikona) — odvodit ze `symbol.svg`.
- **Kruhový avatar** (TikTok + Instagram profily) — odvodit ze symbolu.
- **OG šablona** s taglinem „Porozumět lásce. Porozumět sobě."
- **Stories badge** + **lockup symbol + wordmark v Loře.**

Kdo je dodá: buď wizard jako součást logo systému, nebo je tým vygeneruje ze symbolu. V zadání jsou vedené jako `[ČEKÁ NA ROMANA – schválení lockupu]`.

## Jedna věta pro tým do průvodního e-mailu

> Platné zadání je v1.6, všechno starší ignorujte. Přiložené tři SVG jsou hotové — nasaďte je, rub se srdcem nahrazuje hvězdový rub všude. Wordmark a odvozené formáty (512px ikona, avatar, OG, Stories badge) ještě dodáme — do té doby je nevyrábějte podle vlastní úvahy. První věc k zodpovězení je blokerová otázka o ledgeru v sekci 4 — na ní stojí datum spuštění.

## Poznámka k té větě, kterou to celé rámuje

„Nejlepší a největší spirituální aplikace na světě" je interní severka — **nikdy nejde do produktu ani do žádného textu, který uvidí zákaznice** (invariant 6 zadání). Do průvodního e-mailu týmu patří, do appky ne. Držme to oddělené, ať se nestane to, co se stalo se „server-side ledger" v profilu.
