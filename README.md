# Pokémon M3 AR Cards Dashboard

A web dashboard for tracking prices and availability of Pokémon M3 set AR (Art Rare) cards from multiple Japanese retailers.

## Features

- 🔍 **Automated Web Scraping**: Scrapes M3 AR card data from Japan-Toreca and TorecaCamp
- 💰 **Price Tracking**: Tracks prices across different card qualities (A, A-, B)
- 📊 **Historical Data**: Stores price history for trend analysis
- 🎯 **Smart Comparison**: Shows lowest prices and best quality-to-price ratio
- 📈 **Out-of-Stock Tracking**: Maintains historical prices for unavailable cards
- 🚀 **Vercel Ready**: Deployed and ready to use

## Data Sources

1. **Japan-Toreca** (`shop.japan-toreca.com`)
   - Comprehensive M3 AR card inventory
   - Quality grades: A, A-, B
   - Stock quantities available

2. **TorecaCamp** (`torecacamp-pokemon.com`)
   - Alternative pricing source
   - Price ranges for different qualities
   - Stock availability tracking

## Installation

```bash
# Install dependencies
npm install

# Install additional dependencies for scraping
npm install cheerio puppeteer
```

## Usage

### Run the Scraper

```bash
# Scrape data and generate dashboard JSON
node scrape.js
```

This will:
1. Scrape M3 AR cards from both sources
2. Update price history
3. Calculate profit margins
4. Generate `public/dashboard-data.json`

### Test Scrapers

```bash
# Run test script
node test-scraper.js
```

### API Endpoints (Next.js)

Create API routes to serve the scraped data:

```typescript
// pages/api/cards.ts
import { generateDashboardData } from '@/lib/dashboard-data';

export default async function handler(req, res) {
  const cards = await generateDashboardData();
  res.status(200).json(cards);
}

// pages/api/summary.ts
import { getDashboardSummary } from '@/lib/dashboard-data';

export default async function handler(req, res) {
  const summary = await getDashboardSummary();
  res.status(200).json(summary);
}
```

## Project Structure

```
pokemonarbdashboard/
├── src/
│   └── lib/
│       ├── scrapers.ts         # Web scraping logic
│       ├── storage.ts          # Data persistence & history
│       └── dashboard-data.ts   # Dashboard data generator
├── data/                       # Scraped data storage
│   ├── current-cards.json      # Latest card data
│   └── price-history.json      # Historical price tracking
├── public/
│   └── dashboard-data.json     # Dashboard-ready JSON
├── scrape.js                   # CLI scraper tool
├── test-scraper.js             # Testing script
└── README.md
```

## Data Format

### Card Data Structure

```typescript
interface DashboardCard {
  id: string;                    // Unique identifier
  name: string;                  // Card name (e.g., "モクロー")
  cardNumber: string;            // Card number (e.g., "082/080")
  prices: {
    qualityA?: {
      price: number;
      stock: number | null;
      availability: 'in_stock' | 'out_of_stock';
      sources: Array<{
        source: string;
        price: number;
        url: string;
      }>;
    };
    qualityAMinus?: { /* same structure */ };
    qualityB?: { /* same structure */ };
  };
  lowestPrice: number;           // Best price across all qualities
  lowestPriceQuality: string;    // Quality at lowest price
  lowestPriceSource: string;     // Source with lowest price
  priceHistory?: Array<{
    date: string;
    price: number;
    availability: string;
  }>;
  lastUpdated: string;
}
```

## Business Logic

### Price Comparison
- Shows prices for A, A-, and B quality grades
- Highlights the lowest price across all qualities
- Displays source and quality for best deal

### Historical Prices
- Maintains price history for each card
- Shows trends over time
- Keeps last 100 price points per card
- Useful for out-of-stock items

### Profit Calculation
- Calculates profit margin on lowest price
- Suggests best quality-to-price ratio
- Helps identify arbitrage opportunities

## Automation

### Scheduled Scraping

Add a cron job or use Vercel Cron to run the scraper periodically:

```javascript
// vercel.json
{
  "crons": [{
    "path": "/api/scrape",
    "schedule": "0 */6 * * *"  // Every 6 hours
  }]
}
```

### API Route for Scraping

```typescript
// pages/api/scrape.ts
import { generateDashboardData } from '@/lib/dashboard-data';

export default async function handler(req, res) {
  // Verify authorization
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const cards = await generateDashboardData();
  res.status(200).json({ 
    success: true, 
    cardsUpdated: cards.length 
  });
}
```

## Dashboard Features

### Display Requirements
1. **Card Grid**: Show all M3 AR cards with images
2. **Price Table**: Compare A, A-, and B qualities side-by-side
3. **Best Deal Badge**: Highlight lowest price
4. **Stock Indicator**: Show in-stock vs out-of-stock
5. **Historical Chart**: Price trends over time
6. **Source Links**: Direct links to buy

### Business Logic Display
- When both A- and B available: Show profit on lowest
- For out-of-stock cards: Show last known price and date
- Multi-source comparison: Show price differences between retailers

## Example Cards

Based on the scraper results, you should see cards like:

- **モクロー AR (082/080)**: ¥500 (A-) / ¥600 (A)
- **ピッピ AR (086/080)**: ¥900 (A-) / ¥1,400 (A)
- **デデンネ AR (085/080)**: ¥600 (A-) / ¥680 (A)
- **チゴラス AR (089/080)**: ¥500 (A/A-)
- **ラッタ AR (092/080)**: ¥400 (A/A-)

## Development

```bash
# Run Next.js development server
npm run dev

# Build for production
npm run build

# Deploy to Vercel
vercel deploy
```

## Notes

- Scraping runs in headless Chromium (Puppeteer)
- Rate limiting: Add delays between requests if needed
- Error handling: Continues on single card failures
- Data persistence: JSON files in `data/` directory

## Reference Dashboard

See https://github.com/Keytoexplore/sv11bsar for dashboard structure reference.

## License

MIT

## Author

Built for tracking Pokémon M3 AR card prices across Japanese retailers.
