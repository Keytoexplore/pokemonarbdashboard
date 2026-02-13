# Pokemon Arb Dashboard - Long-term Memory

## Project Overview

**Purpose**: Track Japanese → US Pokemon TCG arbitrage opportunities
**Current Sets**: M3 (33 cards), M2a (39 cards)
**Last Major Update**: 2026-02-13

## Key Architecture

### Data Sources
1. **Japan-Toreca** - Scraped manually
2. **TorecaCamp** - Scraped with variant support
3. **PokemonPriceTracker API** - US market prices

### Data Flow
- Japanese prices → `data/prices.json` (manual scraper)
- US prices → `data/prices.json` (API updater)
- Dashboard reads from JSON, calculates margins
- Deploy to Vercel after updates

## Working Scripts

| Script | Purpose | Run Frequency |
|--------|---------|---------------|
| `scrape-torecacamp.js` | Scrape variants (A,A-,B) | When prices outdated |
| `scrape-japanese.js` | Basic Japan-Toreca scraper | When prices outdated |
| `update-prices-simple.js` | US prices via API | After Japanese updates |
| `scrape-all.js` | Comprehensive scraper | Daily |

## Important Implementation Details

### TorecaCamp Variants
- Each card has multiple Shopify variants
- Prices differ by quality (A: ¥380, A-: ¥350, B: ¥280)
- Must scrape main page, extract variants JSON
- Update URL with `?variant=ID` for A-/B

### Quality Filtering
- Shows ONLY A- and B (not A, not C)
- Calculations based on lowest A- or B price
- Stock status tracked separately

### Rate Limits
- API: Paid tier = higher limits
- Scrapers: 1 req/sec politeness delay
- Built-in to all scraper scripts

## Adding New Sets

1. Test API set ID
2. Add to `lib/set-mappings.ts`
3. Fetch API data
4. Scrape Japanese prices
5. Update US prices
6. Commit & deploy

See `docs/ADDING-NEW-SET.md` for details.

## Known Issues

- M2a Japanese prices incomplete (cards too new)
- Need manual price entry or wait for shop inventory

## Documentation

- `README.md` - Usage overview
- `docs/SYSTEM-OVERVIEW.md` - Architecture
- `docs/ADDING-NEW-SET.md` - Set addition guide
