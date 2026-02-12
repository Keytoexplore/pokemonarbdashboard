# Pokemon TCG Arbitrage Tracker - Complete System

A production-ready dashboard for tracking Pokemon card arbitrage opportunities between Japanese marketplaces and TCGPlayer.

## 🎯 System Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Japan-Toreca   │     │   TorecaCamp     │     │   TCGPlayer     │
│   (Scraper)     │     │    (Scraper)     │     │     (API)       │
└────────┬────────┘     └────────┬─────────┘     └────────┬────────┘
         │                       │                        │
         └───────────────────────┼────────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │     Card Mapping DB       │
                    │  (Japanese → English)     │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   Arbitrage Calculator    │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   Dashboard (HTML/JS)     │
                    │     Deployed to Vercel    │
                    └───────────────────────────┘
```

## 🚀 Quick Start

### Generate Data
```bash
cd pokemonarbdashboard
export POKEMON_PRICE_TRACKER_API_KEY="your_api_key"
npx tsx run-integration.ts
```

### Test Dashboard
Open `dashboard.html` in your browser.

### Deploy to Vercel
```bash
# Push to GitHub
git push origin main

# Connect repository to Vercel
# Dashboard auto-deploys on every push
```

## 📁 Project Structure

```
pokemonarbdashboard/
├── dashboard.html              # Main dashboard UI
├── run-integration.ts          # Master data pipeline
├── generate-data.ts            # Simple data generator
├── update-data.sh              # Cron script
├── src/lib/
│   ├── scraper.ts             # Japanese site scrapers
│   ├── tcgplayer-api.ts       # TCGPlayer API integration
│   ├── card-mappings.ts       # JP→EN name mappings
│   ├── arbitrage.ts           # Margin calculation
│   └── types.ts               # TypeScript interfaces
├── data/
│   ├── arbitrage-data.json    # Generated dashboard data
│   ├── scraped-raw.json       # Raw scraper output
│   └── tcgplayer-cache.json   # API cache (3-day TTL)
└── vercel.json                # Vercel deployment config
```

## 🔄 Data Pipeline

### 1. Scraping (Every 3 Days)
- **Japan-Toreca**: shop.japan-toreca.com
- **TorecaCamp**: torecacamp-pokemon.com
- **Target**: SR, AR, SAR rarity cards only
- **Output**: `data/scraped-raw.json`

### 2. Card Matching
- Map Japanese names to English names
- Lookup card metadata
- Handle set code translations

### 3. Price Fetching
- Query Pokemon Price Tracker API
- Cache results for 3 days
- Rate limited: 1 req/sec

### 4. Arbitrage Calculation
- Compare Japanese buy price vs TCGPlayer sell price
- Calculate margin % and profit $
- Flag viable opportunities (>20% margin)

### 5. Dashboard Generation
- Sort by margin (highest first)
- Generate stats
- Save to `data/arbitrage-data.json`

## 🎴 Card Mapping System

Japanese sets have different numbering than English sets:

| Japanese | English | Example |
|----------|---------|---------|
| M3 | Paradigm Trigger | 098/080 → ??? |
| SV9 | (varies by card) | 092/080 → ??? |

**Challenge**: Same card has different numbers in JP vs EN sets.

**Solution**: Manual mapping database in `src/lib/card-mappings.ts`

## 💰 Arbitrage Calculation

```
Margin % = ((TCGPlayer Price - Japanese Price) / Japanese Price) × 100

Example:
- Japanese: ¥500 (~$3.25)
- TCGPlayer: $12.82
- Margin: ((12.82 - 3.25) / 3.25) × 100 = 294%
```

## 🖥️ Dashboard Features

### Card Display
- Japanese name (primary)
- English name (when mapped)
- Card number & set
- Rarity badge (SR/AR/SAR)
- Quality indicator (A/A-/B)

### Price Comparison
- Japanese price (JPY + USD)
- TCGPlayer market price
- Margin percentage
- Profit amount
- "LOWEST" indicator

### Links
- 🔗 Japan-Toreca product page
- 🔗 TorecaCamp product page
- 🔗 TCGPlayer search
- All open in new tab

### Filters
- By rarity (SR/AR/SAR)
- By set (M3/SV9/etc.)
- By source
- Sort options

## ⏰ Automation

### Cron Job (Every 3 Days)
```cron
0 2 */3 * * /bin/bash /path/to/update-data.sh
```

Runs at 2 AM Lisbon time:
1. Scrapes Japanese sites
2. Fetches TCGPlayer prices
3. Calculates arbitrage
4. Updates dashboard data
5. Commits to GitHub (optional)

## 🔧 Configuration

### Environment Variables
```bash
export POKEMON_PRICE_TRACKER_API_KEY="your_api_key_here"
```

### Sets to Track
Edit `src/lib/arbitrage.ts`:
```typescript
const CONFIG = {
  sets: ['M3', 'SV9', 'SV8a', 'SV8', 'SV7'],
  // ...
};
```

### Margin Threshold
```typescript
minMarginPercent: 20  // Only show >20% margin
```

## 🐛 Troubleshooting

### Scraper Returns 0 Cards
- Check site accessibility
- Verify selectors in `src/lib/scraper.ts`
- Run `test-scraper-debug.ts` to debug

### No TCGPlayer Prices
- Verify API key is set
- Check card mappings exist
- Japanese numbers may not match English

### Dashboard Shows Empty
- Verify `data/arbitrage-data.json` exists
- Check browser console for JS errors
- Ensure data format matches expected structure

## 📊 Sample Output

```json
{
  "opportunities": [
    {
      "id": "M3-098/080-SR",
      "name": "イベルタルex",
      "cardNumber": "098/080",
      "rarity": "SR",
      "set": "M3",
      "tcgplayer": {
        "marketPrice": 12.82,
        "sellerCount": 4
      },
      "japanesePrices": [...],
      "marginPercent": 294,
      "marginAmount": 9.57,
      "isViable": true
    }
  ],
  "stats": {
    "totalCards": 42,
    "viableOpportunities": 15,
    "avgMargin": 156
  }
}
```

## 🚀 Deployment Checklist

- [ ] Set API key in environment
- [ ] Configure sets to track
- [ ] Test scraper locally
- [ ] Verify card mappings
- [ ] Generate initial data
- [ ] Test dashboard display
- [ ] Push to GitHub
- [ ] Connect to Vercel
- [ ] Set up cron job
- [ ] Monitor first few runs

## 📞 Support

For issues with:
- **Scraper**: Check `test-scraper-debug.ts`
- **API**: Verify key at pokemonpricetracker.com
- **Dashboard**: Check browser console
- **Mappings**: Update `src/lib/card-mappings.ts`

## 📄 License

MIT - Built for Pokemon card arbitrage tracking.