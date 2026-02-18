import { CardsWithFilters } from '@/components/CardsWithFilters';
import { DashboardData } from '@/lib/types';
import { baseCardsData } from '@/lib/card-data';
import * as fs from 'fs';
import * as path from 'path';

// Revalidate every 3 days
export const revalidate = 259200;

/**
 * Read prices from JSON file
 * Falls back to base data if file doesn't exist
 */
function getPricesData(): DashboardData {
  try {
    // Try to read from data/prices.json
    const dataPath = path.join(process.cwd(), 'data', 'prices.json');
    
    if (fs.existsSync(dataPath)) {
      const fileContent = fs.readFileSync(dataPath, 'utf-8');
      const data = JSON.parse(fileContent);
      console.log('[Dashboard] Loaded prices from data/prices.json');
      return data;
    }
  } catch (error) {
    console.error('[Dashboard] Error reading prices file:', error);
  }
  
  // Fallback to base data without US prices
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
