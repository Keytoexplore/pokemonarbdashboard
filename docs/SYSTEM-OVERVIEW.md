# Pokemon TCG Arbitrage Dashboard - System Overview

## Purpose

Track **arbitrage opportunities** for Japanese Pokemon TCG cards by comparing:
- **Buy price** from Japanese shops (Japan-Toreca, TorecaCamp)
- **Sell price** on US market (TCGPlayer via PokemonPriceTracker API)

**Goal**: Identify cards where profit margin > 20% after accounting for shipping/fees.

---

## Data Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ JAPANESE SHOPS  │────▶│   DASHBOARD     │────▶│  USER DECISION  │
│ (Buy prices)    │     │ (Calculate %)   │     │ (What to buy)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       ▲
         │                       │
    ┌────▼────┐            ┌─────┴────┐
    │Scrapers │            │   API    │
    │(manual) │            │  (auto)  │
    └─────────┘            └──────────┘
```

---

## Tools Inventory

### **1. Japanese Price Scraper** (RUN MANUALLY)
```bash
# Scrape TorecaCamp (fetches A-, B variants)
node scripts/scrape-torecacamp.js

# Scrape Japan-Toreca (basic fetch)
node scripts/scrape-japanese.js

# Scrape both (comprehensive)
node scripts/scrape-all.js
```

**What it does**:
- Visits each product URL
- Extracts current price, quality (A/A-/B), stock status
- Updates `data/prices.json`

**When to run**:
- When prices seem outdated
- Every 1-3 days
- After adding new cards

---

### **2. US Price Updater** (RUN MANUALLY)
```bash
node scripts/update-prices-simple.js
```

**What it does**:
- Calls PokemonPriceTracker API
- Fetches market price, seller count, images
- Calculates arbitrage margins

**Rate limits**: 1 req/sec (respects this automatically)

**When to run**:
- After scraping Japanese prices
- Daily for active tracking
- When adding new cards

---

### **3. Dashboard UI**

**Features**:
- Set filter (M3, M2a, etc.)
- Rarity filter (AR, SR, SAR)
- Quality filter (A-, B only - A and C hidden)
- Profit sort
- Stock indicators

**File**: `components/CardsWithFilters.tsx`

---

## Data Storage

### **Main File: `data/prices.json`**

Structure:
```json
{
  "opportunities": [
    {
      "id": "M3-089/080-AR",
      "name": "Tyrunt",
      "cardNumber": "089/080",
      "rarity": "AR",
      "set": "M3",
      "japanesePrices": [
        {
          "source": "torecacamp",
          "priceJPY": 280,
          "priceUSD": 1.82,
          "quality": "B",
          "inStock": true,
          "url": "...",
          "isLowest": true
        },
        {
          "source": "japan-toreca",
          "priceJPY": 250,
          "priceUSD": 1.63,
          "quality": "A-",
          "inStock": true,
          "url": "...",
          "isLowest": false
        }
      ],
      "lowestJapanesePrice": 1.63,
      "usPrice": {
        "marketPrice": 4.27,
        "sellerCount": 3,
        "imageUrl": "...",
        "tcgPlayerUrl": "..."
      },
      "marginPercent": 161.9,
      "isViable": true
    }
  ],
  "lastUpdated": "2026-02-13..."
}
```

Key fields:
- `japanesePrices[]` - Prices from both shops
- `lowestJapanesePrice` - Best A-/B price (used for calculation)
- `usPrice.marketPrice` - TCGPlayer price
- `marginPercent` - Calculated profit
- `isViable` - True if margin > 20%

---

## Scalable Workflow

### **Daily Operation**

```bash
# 1. Scrape Japanese prices (~2-3 minutes)
node scripts/scrape-all.js

# 2. Update US prices (~1 minute)
node scripts/update-prices-simple.js

# 3. Commit & deploy
git add data/prices.json
git commit -m "update: Daily price refresh"
git push origin main
# Vercel auto-deploys
```

### **Adding New Set (e.g., M4)**

```bash
# 1. Discover set ID
curl "https://pokemonpricetracker.com/api/v2/cards?set=m4&language=japanese"

# 2. Add set mapping
echo "'M4': { apiSetId: 'm4' }" >> lib/set-mappings.ts

# 3. Get API data
node scripts/fetch-set-api.js M4

# 4. Create card structure
node scripts/add-set-structure.js M4

# 5. Scrape Japanese prices
node scripts/scrape-torecacamp.js  # Filter to M4

# 6. Fetch US prices
node scripts/update-prices-simple.js

# 7. Deploy
git push
```

---

## Key Implementation Details

### **Quality Filtering**
- **Shows**: A-, B
- **Hides**: A (too expensive), C (too risky)
- **Calculation**: Lowest A- or B price

### **TorecaCamp Variants**
- Each card has multiple Shopify variants
- A: Base URL
- A-/B: URL + `?variant=ID`
- Scraper picks cheapest A-/B

### **Stock Handling**
- Shows "Out of Stock" when A-/B unavailable
- Still calculates based on last known price
- Links still work (user can check other qualities)

### **Rate Limits**
- **API**: 60 req/min (free), higher with paid tier
- **Scrapers**: 1 req/sec (politeness)
- **Script delays**: Built-in to respect limits

---

## File Structure

```
pokemonarbdashboard/
├── app/
│   ├── page.tsx              # Main page
│   └── api/prices/route.ts   # Live price API
├── components/
│   └── CardsWithFilters.tsx  # Main grid
├── lib/
│   ├── set-mappings.ts       # Set → API ID
│   ├── card-data.ts          # Base card definitions
│   └── types.ts              # TypeScript types
├── data/
│   ├── prices.json           # ⭐ Main data file
│   └── m2a-api-cards.json    # Cached API responses
├── scripts/
│   ├── scrape-all.js         # ⭐ Main scraper
│   ├── scrape-torecacamp.js  # TorecaCamp variants
│   ├── update-prices-simple.js  # US price updater
│   └── scrape-japanese.js    # Basic fetch scraper
└── docs/
    ├── ADDING-NEW-SET.md     # Set addition guide
    └── API-REFERENCE.md      # API docs
```

---

## Troubleshooting

### "Prices outdated"
→ Run `node scripts/scrape-all.js`

### "TorecaCamp shows wrong quality"
→ Run `node scripts/scrape-torecacamp.js` (handles variants)

### "Build fails"
→ Check TypeScript: `npm run build`

### "API rate limited"
→ Wait 1 hour or upgrade to paid tier

---

## Quick Commands

```bash
# Full refresh
node scripts/scrape-all.js && node scripts/update-prices-simple.js

# Just TorecaCamp (variants)
node scripts/scrape-torecacamp.js

# Just Japan-Toreca
node scripts/scrape-japanese.js

# Test API
node scripts/test-api.ts

# Build & test
npm run build
```

---

**Last Updated**: 2026-02-13
**Version**: 2.1 (Multi-set support)
