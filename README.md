# Pokemon TCG Japanese Arbitrage Dashboard

A Next.js dashboard that tracks arbitrage opportunities for Japanese Pokemon TCG cards (M3 set), comparing Japanese buy prices from Japan-Toreca/TorecaCamp to US sell prices from TCGPlayer via PokemonPriceTracker API.

## What It Does

- **Tracks 33 M3 cards** (AR, SR, SAR rarities)
- **Compares prices**: Japan buy price vs US market price
- **Filters quality**: Shows only A- and B quality (skips A and C)
- **Calculates profit margins**: Shows % profit potential for arbitrage
- **Displays stock status**: Indicates when cards are out of stock
- **Live links**: Direct links to Japanese shops and TCGPlayer listings

## Dashboard Features

| Feature | Description |
|---------|-------------|
| **Quality Filtering** | Only A- and B quality prices displayed |
| **Profit Margin Badges** | Color-coded badges on card images showing profit % |
| **Stock Indicators** | Shows "Out of Stock" when A-/B unavailable |
| **Sorting** | Sort by profit %, price, or name |
| **Rarity Filter** | Filter by AR, SR, or SAR |
| **Search** | Search by card name or number |
| **TCGPlayer Links** | Direct links to US market listings |

## Project Structure

```
pokemonarbdashboard/
├── app/                          # Next.js App Router
│   ├── api/prices/route.ts       # API endpoint for live price fetching
│   ├── page.tsx                  # Main dashboard page
│   └── layout.tsx                # Root layout
├── components/
│   └── CardsWithFilters.tsx      # Main card grid with filtering
├── lib/
│   ├── card-data.ts              # Base card definitions (33 cards)
│   ├── types.ts                  # TypeScript interfaces
│   ├── set-mappings.ts           # Japanese set code mappings
│   ├── scraper.ts                # Original scraper (legacy)
│   └── scrapers.ts               # Scraper classes (legacy)
├── data/
│   └── prices.json               # Current prices (Japanese + US)
├── scripts/                      # Price update utilities
│   ├── scrape-japanese.js        # Fetch-based Japanese scraper
│   ├── scrape-torecacamp.js      # TorecaCamp variant scraper ⭐
│   ├── update-prices-simple.js   # US price updater (API)
│   └── test-api.ts               # API connectivity test
└── dist/                         # Build output
```

## Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Japan-Toreca   │────▶│                  │     │                 │
│   (scraped)     │     │  data/prices.json│────▶│  Dashboard UI   │
└─────────────────┘     │                  │     │                 │
┌─────────────────┐     │  - Japanese      │     └─────────────────┘
│   TorecaCamp    │────▶│    prices        │              ▲
│   (scraped)     │     │  - US prices     │              │
└─────────────────┘     │  - Calculated    │     ┌────────┴────────┐
                        │    margins       │     │  API fallback   │
┌─────────────────┐     │                  │     │  (live prices)  │
│ PokemonPrice    │────▶│                  │     └─────────────────┘
│ Tracker API     │     └──────────────────┘
└─────────────────┘
```

## Setting Up

### 1. Install Dependencies

```bash
cd pokemonarbdashboard
npm install
```

### 2. Environment Variables (optional)

Create `.env.local` for API key:
```env
POKEPRICE_API_KEY=your_api_key_here
```

If not set, uses the free tier API key included in `next.config.js`.

### 3. Run Development Server

```bash
npm run dev
```

## Updating Prices

### Update Japanese Prices (Most Important)

Japan-Toreca and TorecaCamp prices are **not automatic** - you must run the scraper:

```bash
# Update ALL Japanese prices (recommended)
node scripts/scrape-japanese.js

# Or update just TorecaCamp with variants (A, A-, B)
node scripts/scrape-torecacamp.js
```

**Note**: These scripts fetch fresh data from the Japanese shops. Run them:
- When prices seem outdated
- Every few days to stay current
- After noticing discrepancies

### Update US Prices

US prices from TCGPlayer (via PokemonPriceTracker API):

```bash
node scripts/update-prices-simple.js
```

This updates:
- Market prices
- Seller counts
- TCGPlayer links
- Images

### Understanding the Scripts

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `scrape-japanese.js` | Scrapes both Japan-Toreca and TorecaCamp | Daily/When prices seem off |
| `scrape-torecacamp.js` | Scrapes TorecaCamp with variant support ⭐ | Better variant detection |
| `update-prices-simple.js` | Updates US prices from API | Daily or after adding cards |

## Key Implementation Details

### Quality Filtering (A- and B only)

The dashboard intentionally filters out **A** and **C** quality:
- **A**: Too expensive, not worth arbitraging
- **C**: Too risky, condition concerns
- **A-** and **B**: Sweet spot for price vs quality

### TorecaCamp Variants

TorecaCamp sells cards in different conditions as **Shopify variants**:
- Same product page, different `?variant=` URLs
- A quality: `https://torecacamp.com/products/xxx` (base URL)
- B quality: `https://torecacamp.com/products/xxx?variant=12345`

The scraper automatically:
1. Fetches all variants from the product page
2. Selects the cheapest A- or B variant
3. Updates the URL to point to that variant

### Stock Status

Cards are considered "Out of Stock" when:
- Japan-Toreca: Page contains "売り切れ" (sold out)
- TorecaCamp: Variant inventory_quantity is 0

When out of stock, the last known price is still shown but calculations adjust.

### Profit Calculation

```
Profit % = ((US Price - Japan Price) / Japan Price) × 100

Example:
- Japan: ¥250 × 0.0065 = $1.63
- US: $4.27
- Profit: (($4.27 - $1.63) / $1.63) × 100 = 161.9%
```

## Known Issues & Solutions

### Issue: TorecaCamp shows "No A-/B available" but B is available

**Cause**: Old scraper only fetched base price (A quality)

**Solution**: Run `scrape-torecacamp.js` which handles variants properly

### Issue: Dashboard shows different price than website

**Cause**: Data is static and needs refreshing

**Solution**: 
```bash
node scripts/scrape-japanese.js
```

### Issue: TypeScript build error in lib/scraper.ts

**Solution**: Check function signatures match (e.g., `detectRarity(cardNumber)` takes 1 arg)

### Issue: Prices in yen are 100x too high

**Cause**: Shopify returns prices in cents (e.g., 28000 = ¥280)

**Solution**: Scraper divides by 100 (already fixed in scrape-torecacamp.js)

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

```bash
# With Vercel CLI
vercel --prod

# Or push to GitHub, Vercel auto-deploys
```

### After Price Updates

Always commit and push after updating prices:

```bash
node scripts/scrape-torecacamp.js  # Update prices
git add data/prices.json             # Add changes
git commit -m "update: Refresh Japanese prices"
git push origin main
```

## Adding New Cards

To add a new set (e.g., M4):

1. **Add set mapping** to `lib/set-mappings.ts`
2. **Add card definitions** to `lib/card-data.ts` (with Japan-Toreca and TorecaCamp URLs)
3. **Run scraper** to get fresh prices
4. **Run US updater** to get TCGPlayer prices
5. **Commit and deploy**

## API Reference

### GET /api/prices

Query params: `set=M3&number=089`

Returns US price data from PokemonPriceTracker API.

### Data Schema

See `lib/types.ts` for full interface definitions.

Key interfaces:
- `ArbitrageOpportunity` - Card with all pricing data
- `JapanesePrice` - Japan-Toreca or TorecaCamp price entry
- `USMarketData` - TCGPlayer market data

## Troubleshooting

### Scraper not working?

Test individual URLs:
```bash
node scripts/debug-jt.js  # Test Japan-Toreca
node scripts/debug-tc.js  # Test TorecaCamp
```

### Price extraction failing?

Check if shop changed HTML structure:
- Japan-Toreca: Look for `<span class="product-price">`
- TorecaCamp: Look for `"variants":` JSON in page

### Build failing on Vercel?

1. Check Node.js version (requires 18+)
2. Ensure `node_modules` is in `.gitignore`
3. Check TypeScript errors: `npx tsc --noEmit`

## Credits

- **Data Sources**: Japan-Toreca, TorecaCamp, PokemonPriceTracker
- **Framework**: Next.js 16 + TypeScript + Tailwind CSS
- **Scraping**: Puppeteer + Cheerio

## License

Private - For personal arbitrage tracking only.

---

**Last Updated**: 2026-02-13
**Dashboard Version**: 2.0 (with variant support)
