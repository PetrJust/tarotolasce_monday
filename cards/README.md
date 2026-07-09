# Obrázky tarotových karet

Sem patří 78 karet jako `{id}.webp` (např. `blazen.webp`, `mag.webp`,
`dvojka-pohary.webp`) + volitelně `back.webp` (rub). Dokud tu soubory
nejsou, appka vykresluje SVG placeholder – funguje, ale bez ilustrací.

## Doporučený formát

- **600 × 960 px** (poměr 1 : 1,6)
- **WebP**, kvalita ~82
- ~40–80 KB na kartu, celkem ~4–6 MB za balík

## Dávkový převod (z libovolných originálů)

Skript `scripts/prevod-karet.mjs` vezme originály (JPG/PNG/WebP, jakýkoli
rozměr) a vyrobí z nich sjednocené 600×960 WebP rovnou sem.

```bash
# jednorázově doinstaluj převodní knihovnu
npm install

# převeď: složka s originály -> public/cards/
npm run karty -- ./cesta/k/originalum --bg "#2B1340"
#   --bg   barva výplně za kartou (pro JPG bez průhlednosti); vynech pro průhledné
#   --back když máš i rub karty (soubor s id "back"), přidej tenhle přepínač
```

### Jak spárovat vstupní soubory s kartami

Stačí jedna z možností:

1. **Pojmenuj soubory rovnou id karty** – `blazen.jpg`, `mag.png`, … Seznam
   všech 78 id je v `scripts/card-ids.json`. (Nejspolehlivější.)
2. **Přilož `mapa.json`** do složky s originály:
   ```json
   { "IMG_2231.jpg": "blazen", "IMG_2232.jpg": "mag" }
   ```

Skript na konci vypíše, které karty se převedly, kolik ušetřil místa a
které z 78 ještě chybí nebo se nepodařilo spárovat.
