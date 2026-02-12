# Pokemon TCG Arbitrage Tracker

A simple dashboard for tracking Pokemon card arbitrage opportunities between Japanese marketplaces and TCGPlayer.

## Architecture

This is a **simplified static site** that focuses on doing one thing well: showing arbitrage opportunities.

### How It Works

1. **Scrapers** (Node.js + Puppeteer) fetch prices from:
   - https://shop.japan-toreca.com/
   - https://torecacamp-pokemon.com/

2. **API Integration** fetches TCGPlayer market prices via Pokemon Price Tracker API

3. **Arbitrage Calculation** computes margins between Japanese buy price and TCGPlayer sell price

4. **Static Dashboard** displays opportunities sorted by margin percentage

## Quick Start

```bash
# Install dependencies
npm install

# Set environment variable
export POKEMON_PRICE_TRACKER_API_KEY="your_api_key"

# Generate data (run this to update prices)
npx tsx generate-data.ts

# Serve locally
npx serve .
```

## Data Flow

```
Scrape Japanese Sites → Get TCGPlayer Prices → Calculate Margins → Save to JSON → Display in Dashboard
```

## Key Features

- ✅ **Focus on SR, AR, SAR cards** only (the profitable ones)
- ✅ **Grade indicators**: Perfect 🔥 (>150%), Good 💎 (>70%), Medium ⚖️ (>30%), Low ❌
- ✅ **"LOWEST" indicators** showing best Japanese price
- ✅ **Stock status** for each source
- ✅ **Currency conversion** (JPY → USD)
- ✅ **Seller counts** from TCGPlayer
- ✅ **Simple, clean UI** - no complexity

## Project Structure

```
├── dashboard.html          # Main dashboard (static)
├── generate-data.ts        # Script to generate arbitrage data
├── src/lib/
│   ├── types.ts           # TypeScript interfaces
│   ├── scraper.ts         # Japanese site scrapers
│   ├── tcgplayer-api.ts   # Pokemon Price Tracker API
│   └── arbitrage.ts       # Core arbitrage calculation
├── data/
│   └── arbitrage-data.json # Generated data file
└── vercel.json            # Vercel deployment config
```

## Deployment

1. Push to GitHub
2. Connect to Vercel
3. Set environment variable: `POKEMON_PRICE_TRACKER_API_KEY`
4. Vercel will auto-deploy the static dashboard

## Updating Data

Run `npx tsx generate-data.ts` to refresh prices. You can schedule this with a cron job or GitHub Actions.

## API Key

Get your API key from: https://www.pokemonpricetracker.com/
