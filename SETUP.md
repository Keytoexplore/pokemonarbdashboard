# Adding a New Set - Quick Guide

This guide explains how to add a new Japanese Pokemon TCG set to the dashboard.

## Overview

1. **Scrape Japanese prices** from Japan-Toreca and TorecaCamp
2. **Fetch US prices** from PokemonPriceTracker API
3. **Update the dashboard** with new data
4. **Commit and deploy**

---

## Step 1: Add Set to Mappings

First, add the new set to `lib/set-mappings.ts`:

```typescript
'SV10': {
  jpCode: 'SV10',
  apiSetId: 'new-set-name',  // Find this from PokemonPriceTracker API
  englishName: 'New Set Name',
  japaneseName: 'ニューセット',
  releaseDate: '2026-03-01',
  englishEquivalent: 'English Set Name',  // optional
},
```

---

## Step 2: Scrape Japanese Prices

### Option A: Run the scraper scripts (if available)

```bash
# For Japan-Toreca
node scripts/scrape-japan-toreca.js SV10

# For TorecaCamp  
node scripts/scrape-torecacamp.js SV10
```

### Option B: Manual data entry

Add cards directly to `lib/card-data.ts`:

```typescript
{
  "id": "SV10-001/100",
  "name": "Card Name",
  "cardNumber": "001/100",
  "rarity": "RR",
  "set": "SV10",
  "japanesePrices": [
    {
      "source": "japan-toreca",
      "priceJPY": 100,
      "priceUSD": 0.65,
      "quality": "A",
      "inStock": true,
      "url": "https://shop.japan-toreca.com/products/...",
      "isLowest": true
    }
  ],
  "lowestJapanesePrice": 0.65,
  "usPrice": null,
  "arbitrageUS": null,
  "marginPercent": 0,
  "marginAmount": 0,
  "lastUpdated": "2026-02-13T11:00:00Z",
  "isViable": false
}
```

---

## Step 3: Fetch US Prices

Run the price update script:

```bash
npx ts-node scripts/update-prices.ts
```

This will:
- Fetch US prices from PokemonPriceTracker API (1 req/sec, no rate limits!)
- Calculate arbitrage margins
- Save to `data/prices.json`
- Show success/fail counts

**Note:** If API is rate-limited, wait 1 hour and try again.

---

## Step 4: Commit and Deploy

```bash
git add -A
git commit -m "feat: Add SV10 set data with US prices"
git push
```

Then deploy on Vercel (automatic if connected to GitHub).

---

## File Structure Reference

```
pokemonarbdashboard/
├── lib/
│   ├── card-data.ts        # Add new cards here
│   ├── set-mappings.ts     # Add set mapping here
│   ├── pokemon-api.ts      # API client (no changes needed)
│   └── types.ts            # Type definitions (no changes needed)
├── scripts/
│   ├── update-prices.ts    # Run to fetch US prices
│   ├── scrape-*.ts         # Scraper scripts (if available)
│   └── test-api.ts         # Test API connectivity
├── data/
│   └── prices.json         # Generated - don't edit manually
├── app/
│   └── page.tsx            # Dashboard (reads from prices.json)
└── SETUP.md               # This file
```

---

## Quick Checklist

- [ ] Set added to `lib/set-mappings.ts`
- [ ] Cards added to `lib/card-data.ts`
- [ ] Ran `npx ts-node scripts/update-prices.ts`
- [ ] `data/prices.json` updated with US prices
- [ ] Committed changes to GitHub
- [ ] Deployed to Vercel

---

## Troubleshooting

### API Rate Limited
- Wait 1 hour for block to clear
- Run script again
- Check console output for errors

### Set Not Found
- Verify set mapping in `lib/set-mappings.ts`
- Check PokemonPriceTracker has the set
- Try different `apiSetId` values

### Prices Not Showing
- Check `data/prices.json` exists and has data
- Verify `app/page.tsx` can read the file
- Check Vercel deployment logs

---

## Need Help?

Ask me to:
- "Add set SV10 to the dashboard"
- "Run the scrapers for M2a"
- "Update US prices for all sets"
- "Fix the TorecaCamp URLs for set X"
