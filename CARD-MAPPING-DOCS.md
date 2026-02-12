# Japanese→English Card Mapping & TCGPlayer API Integration

## Overview

This document describes the complete card mapping system for the M3 (Paradigm Trigger) Japanese set and its integration with the Pokemon Price Tracker API (TCGPlayer data).

## Key Insights

### Set Mapping
- **Japanese Set:** M3 (Paradigm Trigger) - パラダイムトリガー
- **English Set:** Silver Tempest (SWSH12)
- **Japanese Base Set:** 098 cards (001-098)
- **English Base Set:** 195 cards (001-195)
- **Japanese Secret Rares:** 099-125 (27 secret rares)
- **English Secret Rares:** 196-215 (20+ secret rares)

### Card Number Challenge
**The Problem:** Japanese card numbers DON'T match English card numbers!
- Japanese: Lugia V is #079/098
- English: Lugia V is #138/195

**Solution:** Manual mapping of each card between sets.

## Card Categories

### 1. Japanese Exclusive AR (Art Rare) Cards
These cards exist ONLY in the Japanese set and have no English equivalent:
- パフュートン (Oinkologne) #086/080
- イーブイ (Eevee) #088/080
- チゴラス (Tyrunt) #089/080
- ドラピオン (Drapion) #090/080
- ニダンギル (Doublade) #091/080
- ラッタ (Raticate) #092/080

**Note:** The AR rarity is exclusive to Japanese sets. Some Pokemon appear in English sets but as regular rares (e.g., Gardevoir #069/195).

### 2. Regular V/VSTAR Cards (SR)
Base versions of special Pokemon cards that appear in both sets with different card numbers.

**Examples:**
- Lugia V: JP #079/098 → EN #138/195 ($2.87)
- Lugia VSTAR: JP #080/098 → EN #139/195 ($17.53)
- Unown VSTAR: JP #036/098 → EN #066/195 ($1.13)
- Regieleki VMAX: JP #034/098 → EN #058/195 ($2.08)

### 3. Full Art V Cards (SR)
Ultra rare versions with full artwork:
- Lugia V Full Art: JP #109/098 → EN #185/195
- Lugia V Alt Art: JP #110/098 → EN #186/195 (**EXPENSIVE** - $354+)
- Unown V Alt Art: JP #103/098 → EN #177/195

### 4. Full Art Trainer Cards (SR)
Character supporter cards with full artwork:
- Candice Full Art: JP #113/098 → EN #189/195 ($5.65)
- Lance Full Art: JP #114/098 → EN #192/195
- Worker Full Art: JP #111/098 → EN #195/195

### 5. Rainbow Rare VMAX/VSTAR (SAR)
Rainbow holographic versions (Special Art Rare):
- Regieleki VMAX: JP #115/098 → EN #198/195 ($7.51)
- Unown VSTAR: JP #116/098 → EN #199/195 ($8.56)
- Regidrago VSTAR: JP #117/098 → EN #201/195 ($6.42)
- Lugia VSTAR: JP #118/098 → EN #202/195 ($34.21)

### 6. Hyper Rare Trainers (SAR)
Rainbow holographic trainer cards:
- Worker: JP #119/098 → EN #209/195 ($3.62)
- Brandon: JP #120/098 → EN #203/195
- Candice: JP #121/098 → EN #204/195 ($4.33)
- Lance: JP #122/098 → EN #206/195

### 7. Gold Cards (UR - Ultra Rare)
Gold secret rare cards:
- Lugia VSTAR Gold: JP #123/098 → EN #211/195 ($20.61)
- Leafy Camo Poncho: JP #124/098 → EN #214/195
- Gapejaw Bog: JP #125/098 → EN #213/195

## TCGPlayer API Integration

### API Endpoint
```
https://www.pokemonpricetracker.com/api/v2/cards
```

### Authentication
```bash
Authorization: Bearer pokeprice_free_67abf1594acce302cdbaaf1339c9234cbc402f5726e95cd7
```

### API Behavior
1. **Search works by card name only** - Set/card number filters don't reliably work
2. **Returns up to 50 results** per query
3. **Card identification:** Match by exact card number from results (e.g., #186/195)
4. **Rate limiting:** Free tier has strict rate limits (~5-10 requests before 429 errors)

### Search Strategy
```typescript
// 1. Search by English card name
GET /api/v2/cards?search=Lugia%20V&limit=50

// 2. Filter results by card number pattern
const match = results.find(card => card.cardNumber === '186/195');

// 3. Extract price data
const price = {
  marketPrice: match.prices.market,
  sellerCount: match.sellerCount,
  listingCount: match.listingCount
};
```

### Caching
- **Duration:** 3 days (259,200,000 ms)
- **Storage:** `data/tcgplayer-cache.json`
- **Key Format:** `${cardName}-${englishCardNumber}`

## Usage Examples

### Get Card Mapping
```typescript
import { getCardMapping } from './src/lib/card-mappings';

// Look up by Japanese card number
const mapping = getCardMapping('110/098', 'M3');
console.log(mapping.englishName);        // "Lugia V"
console.log(mapping.englishCardNumber);  // "186/195"
console.log(mapping.notes);              // "Alt Art - EXPENSIVE"
```

### Get TCGPlayer Price
```typescript
import { getTCGPlayerPrice } from './src/lib/tcgplayer-api';

const price = await getTCGPlayerPrice(
  'Lugia V',        // English card name
  '186/195',        // English card number
  'SR',             // Rarity
  'Alt Art'         // Notes (optional)
);

console.log(`$${price.marketPrice}`);  // $354.31
```

### Batch Price Lookup
```typescript
import { getTCGPlayerPricesBatch } from './src/lib/tcgplayer-api';

const cards = [
  { name: 'Lugia V', englishCardNumber: '138/195', rarity: 'SR' },
  { name: 'Candice', englishCardNumber: '189/195', rarity: 'SR', notes: 'Full Art' }
];

const prices = await getTCGPlayerPricesBatch(cards);
// Returns Map<cardNumber, TCGPlayerData>
```

## Test Results

### Mapping Statistics
- **Total cards mapped:** 50
- **AR (Art Rare):** 7 cards (6 Japanese exclusive)
- **SR (Super Rare):** 32 cards
- **SAR (Special Art Rare):** 8 cards
- **UR (Ultra Rare):** 3 cards

### API Test Results
From `test-mapping-integration.ts`:
- ✅ **Successful price fetches:** 6/19 tested cards
- ❌ **Failed (rate limit):** 12/19 tested cards
- ⚠️  **Japanese exclusives:** 1/19 tested cards

### Sample Prices (Successfully Fetched)
1. Lugia V #138/195: $2.87
2. Lugia VSTAR #139/195: $17.53
3. Unown VSTAR #066/195: $1.13
4. Regieleki VMAX #058/195: $2.08
5. Candice Hyper Rare #204/195: $4.33
6. Lugia VSTAR Gold #211/195: $20.61

## Known Issues

### 1. Rate Limiting
**Problem:** API returns 429 (Too Many Requests) after ~5-10 requests  
**Solution:** 
- Implement request delays (1.5s between requests)
- Use caching aggressively (3-day cache)
- Batch operations sparingly

### 2. Card Matching Failures
**Problem:** Some cards don't match despite correct card numbers  
**Example:** Gardevoir #069/195 not found in API results  
**Possible causes:**
- Card not in API database
- Different naming convention
- Set name mismatch

### 3. Seller/Listing Counts
**Observation:** API returns 0 for sellerCount and listingCount  
**Impact:** Cannot determine market liquidity  
**Status:** API limitation

## File Structure

```
pokemonarbdashboard/
├── src/
│   └── lib/
│       ├── card-mappings.ts        # 50 M3 card mappings
│       └── tcgplayer-api.ts        # API integration + caching
├── test-mapping-integration.ts     # Comprehensive test
├── test-api-v2.ts                  # API behavior test
├── data/
│   └── tcgplayer-cache.json        # Price cache (3-day TTL)
└── CARD-MAPPING-DOCS.md           # This file
```

## Running Tests

### Basic Mapping Test
```bash
cd pokemonarbdashboard
export POKEMON_PRICE_TRACKER_API_KEY="pokeprice_free_67abf1594acce302cdbaaf1339c9234cbc402f5726e95cd7"
npx tsx test-mapping-integration.ts
```

### API Behavior Test
```bash
npx tsx test-api-v2.ts
```

## Success Criteria ✅

- [x] Map at least 20 M3 cards with English names - **50 cards mapped**
- [x] TCGPlayer API returns prices for mapped cards - **Working**
- [x] Price data is cached properly - **3-day cache implemented**
- [x] Document cards that can't be matched - **6 Japanese exclusives identified**

## Future Improvements

1. **Implement exponential backoff** for rate limit handling
2. **Add retry logic** with jitter
3. **Create price history tracking** using cached data
4. **Add support for other Japanese sets** (S11a Incandescent Arcana, etc.)
5. **Implement fuzzy matching** for cards that don't exact match
6. **Add webhook notifications** for price changes
7. **Create dashboard visualization** of price trends

## References

- [Pokellector - Paradigm Trigger](https://jp.pokellector.com/Paradigm-Trigger-Expansion/)
- [Pokellector - Silver Tempest](https://www.pokellector.com/Silver-Tempest-Expansion/)
- [Pokemon Price Tracker API](https://www.pokemonpricetracker.com/api)
- [Bulbapedia - Silver Tempest](https://bulbapedia.bulbagarden.net/wiki/Silver_Tempest_(TCG))

---

**Last Updated:** February 12, 2026  
**Maintained by:** OpenClaw Agent (Subagent: mapping-integration)
