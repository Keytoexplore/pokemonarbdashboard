import { CardsWithFilters } from '@/components/CardsWithFilters';
import { BuilderDashboardData, DashboardData, ArbitrageOpportunity, JapanesePrice } from '@/lib/types';
import { baseCardsData } from '@/lib/card-data';
import * as fs from 'fs';
import * as path from 'path';

// Revalidate every 3 days
export const revalidate = 259200;

/**
 * Read prices from JSON file
 * Falls back to base data if file doesn't exist
 */
function toArbitrageOpportunities(builder: BuilderDashboardData): ArbitrageOpportunity[] {
  const out: ArbitrageOpportunity[] = [];

  for (const c of builder.cards) {
    const jp: JapanesePrice[] = [];

    if (c.japanToreca?.aMinus) {
      jp.push({
        source: 'japan-toreca',
        priceJPY: c.japanToreca.aMinus.priceJPY,
        priceUSD: 0,
        quality: 'A-',
        inStock: true,
        url: c.japanToreca.aMinus.url,
        isLowest: false,
      });
    }

    if (c.japanToreca?.b) {
      jp.push({
        source: 'japan-toreca',
        priceJPY: c.japanToreca.b.priceJPY,
        priceUSD: 0,
        quality: 'B',
        inStock: true,
        url: c.japanToreca.b.url,
        isLowest: false,
      });
    }

    const usMarketPrice = c.usMarket?.tcgplayer?.marketPrice ?? null;

    out.push({
      id: `${c.setId}:${c.number}`,
      name: c.name,
      cardNumber: c.number,
      rarity: c.rarity,
      set: c.set,
      tcgplayer: {
        marketPrice: usMarketPrice ?? 0,
        sellerCount: c.usMarket?.tcgplayer?.sellerCount ?? 0,
      },
      japanesePrices: jp,
      lowestJapanesePrice: 0,
      usPrice:
        usMarketPrice != null
          ? {
              marketPrice: usMarketPrice,
              sellerCount: c.usMarket?.tcgplayer?.sellerCount ?? 0,
              listingCount: 0,
              currency: 'USD',
              imageUrl: c.images?.small || undefined,
              imageCdnUrl: c.images?.large || undefined,
              tcgPlayerUrl: c.usMarket?.tcgplayer?.url || undefined,
            }
          : null,
      arbitrageUS: null,
      marginPercent: 0,
      marginAmount: 0,
      lastUpdated: c.updatedAt,
      isViable: false,
      imageUrl: c.images?.small || undefined,
      lastKnownPrice: null,
    });
  }

  return out;
}

function getPricesData(): DashboardData {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'prices.json');

    if (fs.existsSync(dataPath)) {
      const fileContent = fs.readFileSync(dataPath, 'utf-8');
      const parsed = JSON.parse(fileContent);

      // Legacy dashboard format: { opportunities, lastUpdated, stats }
      if (Array.isArray(parsed?.opportunities) && parsed?.stats) {
        console.log('[Dashboard] Loaded prices from data/prices.json (legacy format)');
        return parsed;
      }

      // Builder format: { meta, cards }
      if (Array.isArray(parsed?.cards) && parsed?.meta) {
        console.log('[Dashboard] Loaded prices from data/prices.json (builder format)');
        const builder = parsed as BuilderDashboardData;
        const opportunities = toArbitrageOpportunities(builder);
        return {
          opportunities,
          lastUpdated: builder.meta.builtAt || new Date().toISOString(),
          stats: {
            totalCards: opportunities.length,
            viableOpportunities: opportunities.filter((c) => c.isViable).length,
            avgMargin: 0,
          },
        };
      }

      console.warn('[Dashboard] Unknown prices.json format; falling back to base data');
    }
  } catch (error) {
    console.error('[Dashboard] Error reading prices file:', error);
  }

  console.log('[Dashboard] Using base card data (no US prices)');
  return {
    opportunities: baseCardsData,
    lastUpdated: new Date().toISOString(),
    stats: {
      totalCards: baseCardsData.length,
      viableOpportunities: 0,
      avgMargin: 0,
    },
  };
}

export default async function Home() {
  const cardsData = getPricesData();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Pokemon TCG Arbitrage
          </h1>
          <p className="text-purple-200">
            Japanese S12a (VSTAR Universe) - AR/SAR/SR/CHR/UR/SSR/RRR Price Tracker (Japan → US Market)
          </p>
          <p className="text-purple-300 text-sm mt-2">
            Last updated: {new Date(cardsData.lastUpdated).toLocaleString()}
          </p>
        </div>

        <CardsWithFilters 
          initialCards={cardsData.opportunities} 
          totalCards={cardsData.stats.totalCards}
          viableOpportunities={cardsData.stats.viableOpportunities}
          avgMargin={cardsData.stats.avgMargin}
          lastUpdated={cardsData.lastUpdated}
        />
      </div>
    </main>
  );
}
