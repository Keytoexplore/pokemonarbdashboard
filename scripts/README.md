# Scripts

This folder contains utility scripts for managing the Pokemon arbitrage dashboard.

## Available Scripts

### add-set.ts
**Purpose:** Guide for adding a new Japanese set to the dashboard  
**Usage:** `npx ts-node scripts/add-set.ts <SET_CODE>`  
**Example:** `npx ts-node scripts/add-set.ts SV10`  
**When to use:** When you want to add a new set to track

### update-prices.ts
**Purpose:** Fetch US prices from PokemonPriceTracker API  
**Usage:** `npx ts-node scripts/update-prices.ts`  
**When to use:** 
- After adding new cards to `lib/card-data.ts`
- Every 3 days to refresh prices
- Before deploying to get latest data

**Notes:**
- Respects API rate limits (1 req/sec)
- Saves results to `data/prices.json`
- Calculates arbitrage margins automatically

### test-api.ts
**Purpose:** Test PokemonPriceTracker API connectivity  
**Usage:** `npx ts-node scripts/test-api.ts`  
**When to use:** 
- When API seems unresponsive
- To check if rate limit is cleared
- To test new set mappings

## Workflow

### Adding a New Set

1. **Add set mapping** to `lib/set-mappings.ts`
2. **Add card data** to `lib/card-data.ts` (scrape or manual)
3. **Run** `npx ts-node scripts/update-prices.ts`
4. **Commit** and push to GitHub
5. **Deploy** on Vercel

### Updating Prices

Just run:
```bash
npx ts-node scripts/update-prices.ts
```

Then commit and push the updated `data/prices.json`.

## Rate Limits

The PokemonPriceTracker API has a rate limit of **60 requests per minute**.

Our scripts use **1.1 second delays** between requests to stay safely under this limit.

If you get rate limited:
- Wait 1 hour for the block to clear
- Run the script again
- It will resume from where it left off
