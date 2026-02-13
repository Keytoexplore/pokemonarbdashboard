# Adding a New Set (e.g., M2a) - Complete Guide

This guide walks through adding a new Japanese Pokemon TCG set to the arbitrage dashboard.

## Overview: What Needs to Happen

```
┌─────────────────────────────────────────────────────────────────┐
│  1. SCRAPE Japanese Prices                                      │
│     - Japan-Toreca: Search for "M2a" + card type (AR/SR/SAR)   │
│     - TorecaCamp: Search for "M2a"                              │
│     - Extract: name, card number, price, quality, URL           │
├─────────────────────────────────────────────────────────────────┤
│  2. ADD Set Mapping                                            │
│     - Add to lib/set-mappings.ts                               │
│     - Map M2a → pokemonpricetracker set ID                     │
├─────────────────────────────────────────────────────────────────┤
│  3. CREATE Card Data Structure                                 │
│     - For each card: ID, name, number, rarity, URLs            │
│     - Add to data/prices.json with empty US prices             │
├─────────────────────────────────────────────────────────────────┤
│  4. FETCH US Prices (API)                                      │
│     - Use PokemonPriceTracker API                              │
│     - Rate limit: 1 req/sec (60/min)                           │
│     - Cache to avoid re-fetching                               │
├─────────────────────────────────────────────────────────────────┤
│  5. VERIFY & TEST                                              │
│     - Check rarity mappings                                    │
│     - Verify profit calculations                               │
│     - Test dashboard filters                                   │
├─────────────────────────────────────────────────────────────────┤
│  6. UPDATE Dashboard UI                                        │
│     - Add set filter dropdown                                  │
│     - Update stats to show by set                              │
│     - Ensure cards display correctly                           │
└─────────────────────────────────────────────────────────────────┘
```

## Step-by-Step Process

### Step 1: Discover the Set Structure

First, understand the new set:

**For M2a (Mythical Island/ミュウツー):**
- How many cards? (e.g., M3 has 205 total, 33 special)
- What are the AR/SR/SAR numbers? (e.g., M3: 081-092 AR, 093-099 SR, 100+ SAR)
- What's the PokemonPriceTracker set ID? (check their API docs)

**Tools:**
```bash
# Test set mapping
node scripts/test-api.ts

# Or manually check:
# https://www.pokemonpricetracker.com/api/v2/cards?set=m2a&language=japanese
```

### Step 2: Scrape Japanese Shops

**Japan-Toreca Search Strategy:**
```bash
# Search for AR cards
https://shop.japan-toreca.com/search?q=m2a+ar

# Search for SR cards
https://shop.japan-toreca.com/search?q=m2a+sr

# Search for SAR cards
https://shop.japan-toreca.com/search?q=m2a+sar
```

**TorecaCamp Search Strategy:**
```bash
https://torecacamp-pokemon.com/collections/all?q=m2a
```

**Scraping Script (create if needed):**
```typescript
// scripts/scrape-m2a.ts
// Adapt scrape-torecacamp.js for M2a
// 1. Search for cards
// 2. Extract product URLs
// 3. Scrape each product page
// 4. Output to data/m2a-scraped.json
```

**Rate Limiting:**
- Japan-Toreca: ~1 req/sec (be polite)
- TorecaCamp: ~1 req/sec
- Add delays between requests

### Step 3: Add Set Mapping

**Add to `lib/set-mappings.ts`:**
```typescript
export const SET_MAPPINGS: Record<string, string> = {
  'M3': 'm3',           // Existing
  'M2a': 'm2a',         // NEW
  'SV10': 'sv10',       // If adding
};

export function getApiSetId(setCode: string): string {
  return SET_MAPPINGS[setCode] || setCode.toLowerCase();
}
```

### Step 4: Create Card Data

**Option A: Manual (for small sets)**
Edit `data/prices.json` and add new cards:
```json
{
  "opportunities": [
    // ... existing M3 cards ...
    {
      "id": "M2a-071/064-AR",
      "name": "Mew ex",
      "cardNumber": "071/064",
      "rarity": "AR",
      "set": "M2a",
      "japanesePrices": [
        {
          "source": "japan-toreca",
          "priceJPY": 1500,
          "priceUSD": 9.75,
          "quality": "A-",
          "inStock": true,
          "url": "https://shop.japan-toreca.com/products/pokemon-xxxxx",
          "isLowest": false
        },
        {
          "source": "torecacamp",
          "priceJPY": 1200,
          "priceUSD": 7.80,
          "quality": "B",
          "inStock": true,
          "url": "https://torecacamp-pokemon.com/products/rc_xxxxx",
          "isLowest": true
        }
      ],
      "lowestJapanesePrice": 7.80,
      "usPrice": null,
      "arbitrageUS": null,
      "marginPercent": 0,
      "marginAmount": 0,
      "lastUpdated": "2026-02-13T15:00:00.000Z",
      "isViable": false
    }
    // ... more M2a cards ...
  ]
}
```

**Option B: Script (for large sets)**
Create a conversion script:
```typescript
// scripts/convert-scraped-to-json.ts
// Takes scraped data → prices.json format
```

### Step 5: Fetch US Prices

**Important: Rate Limiting**

```bash
# For 30 cards:
# 30 requests × 1.1 sec = ~33 seconds

node scripts/update-prices-simple.js
```

**The script automatically:**
- Respects 1.1s delay between requests
- Skips existing US prices (checks cache)
- Recalculates arbitrage margins

**API Limits:**
- Free tier: 60 requests/minute
- If rate limited: Wait 1 hour, retry

**Optimization - Batching:**
```typescript
// In update-prices-simple.js
const BATCH_SIZE = 10;
const BATCH_DELAY = 10000; // 10 sec between batches

for (let i = 0; i < cards.length; i += BATCH_SIZE) {
  const batch = cards.slice(i, i + BATCH_SIZE);
  await processBatch(batch);
  await delay(BATCH_DELAY);
}
```

### Step 6: Update Dashboard for Multi-Set Support

**Current:** Dashboard shows all cards mixed together

**Goal:** Add set filter, show stats by set

**Changes needed:**

#### A. Update `CardsWithFilters.tsx`

Add set filter dropdown:
```typescript
const [filterSet, setFilterSet] = useState<string>('all');

// In filteredCards useMemo:
if (filterSet !== 'all') {
  cards = cards.filter(c => c.set === filterSet);
}

// Add to filter UI:
<select value={filterSet} onChange={e => setFilterSet(e.target.value)}>
  <option value="all">All Sets</option>
  <option value="M3">M3 (Nihil Zero)</option>
  <option value="M2a">M2a (Mythical Island)</option>
</select>
```

#### B. Update Stats Display

Show stats per set:
```typescript
// Calculate stats by set
const statsBySet = useMemo(() => {
  const stats: Record<string, { count: number; viable: number; avgMargin: number }> = {};
  
  for (const card of initialCards) {
    if (!stats[card.set]) {
      stats[card.set] = { count: 0, viable: 0, avgMargin: 0 };
    }
    stats[card.set].count++;
    if (card.isViable) stats[card.set].viable++;
  }
  
  // Calculate averages
  for (const set in stats) {
    const setCards = initialCards.filter(c => c.set === set);
    stats[set].avgMargin = setCards.reduce((s, c) => s + c.marginPercent, 0) / setCards.length;
  }
  
  return stats;
}, [initialCards]);
```

#### C. Update Page Title

Show current set:
```typescript
<h1>Pokemon TCG Arbitrage {filterSet !== 'all' && `- ${filterSet}`}</h1>
```

### Step 7: Testing Checklist

Before deploying:

- [ ] All cards have correct rarity (AR/SR/SAR)
- [ ] Card numbers match (071/064 format)
- [ ] Japanese prices are realistic (not ¥10000 when should be ¥250)
- [ ] US prices fetched successfully
- [ ] Arbitrage margins calculated correctly
- [ ] Set filter works in UI
- [ ] Cards display with correct images
- [ ] Links open to correct product pages
- [ ] Build succeeds: `npm run build`

### Step 8: Deploy

```bash
# 1. Build
npm run build

# 2. Commit
git add -A
git commit -m "feat: Add M2a set support

- Scraped 25 M2a cards from Japan-Toreca and TorecaCamp
- Added set mapping for M2a → m2a
- Fetched US prices for all cards
- Updated dashboard with set filter
- Build passes"

# 3. Push
git push origin main

# 4. Vercel auto-deploys
```

## Common Issues When Adding Sets

### Issue 1: API returns 404 for set

**Cause:** Set code mismatch

**Fix:** Check PokemonPriceTracker API docs for correct set ID:
```bash
# Try variations:
?set=m2a
?set=M2a
?set=mythical-island
```

### Issue 2: Scraper finds wrong cards

**Cause:** Search too broad

**Fix:** Add card type to search:
```
japan-toreca.com/search?q=m2a+ar    (not just "m2a")
```

### Issue 3: Prices wildly wrong

**Cause:** Shopify prices in cents not yen

**Fix:** Divide by 100:
```typescript
price: Math.round(variant.price / 100)
```

### Issue 4: Rarity incorrectly assigned

**Cause:** Wrong assumption about card number ranges

**Fix:** For each set, verify the pattern:
```typescript
// M3 pattern:
// 081-092 = AR
// 093-099 = SR
// 100+ = SAR

// M2a might be different!
// Check actual cards to determine pattern
```

### Issue 5: Scraper runs too long

**Solution:** Add batching and caching:
```typescript
// Cache scraped results
const cacheFile = 'data/scrape-cache-m2a.json';
const cache = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile)) : {};

// Skip if cached and < 24 hours old
if (cache[url] && Date.now() - cache[url].timestamp < 86400000) {
  return cache[url].data;
}
```

## Universal Set Addition (One Command)

```bash
# Add ANY set with one command
node scripts/add-set.js M2a

# Or
node scripts/add-set.js SV9

# Or  
node scripts/add-set.js SV10
```

**This script:**
1. ✅ Fetches cards from PokemonPriceTracker API
2. ✅ Scrapes TorecaCamp by set+rarity (m2a ar, m2a sr, m2a sar)
3. ✅ Scrapes Japan-Toreca by set+rarity
4. ✅ Matches prices by card number
5. ✅ Calculates arbitrage margins
6. ✅ Adds to dashboard automatically

**Takes ~5-10 minutes** (respects rate limits)

---

## Manual Checklist (if needed)

```markdown
## Before You Start
- [ ] Confirm set code works: node scripts/test-api.ts <SET>

## One-Command Addition
- [ ] Run: node scripts/add-set.js <SET_CODE>
- [ ] Review output for errors
- [ ] Check data/prices.json

## Deploy
- [ ] npm run build
- [ ] git add data/prices.json
- [ ] git commit -m "feat: Add <SET>"
- [ ] git push
- [ ] Verify dashboard
```

## Example: Adding M2a Cards

Here's a concrete example for M2a (Mythical Island):

```typescript
// 1. Scraped these cards from Japan-Toreca:
const m2aCards = [
  { number: "071/064", name: "Mew ex", rarity: "AR", jtPrice: 1500, tcPrice: 1200 },
  { number: "072/064", name: "Lapras", rarity: "AR", jtPrice: 800, tcPrice: 600 },
  // ... etc
];

// 2. Set mapping:
SET_MAPPINGS['M2a'] = 'm2a'; // or 'mythical-island' if that's the API code

// 3. After US price fetch:
// Mew ex: Japan ¥1200 → US $15.00 = 175% profit ✓
// Lapras: Japan ¥600 → US $4.00 = 85% profit ✓
```

---

**Need help?** Check the debug scripts:
- `scripts/test-api.ts` - Test API connectivity
- `scripts/debug-jt.js` - Test Japan-Toreca scraping
- `scripts/debug-tc.js` - Test TorecaCamp scraping
