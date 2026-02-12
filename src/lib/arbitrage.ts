import { scrapeAllSets } from './scraper';
import { getTCGPlayerPrice, getCacheStats } from './tcgplayer-api';
import { ArbitrageOpportunity, DashboardData } from './types';
import * as fs from 'fs';
import * as path from 'path';

const JPY_TO_USD = 0.0065;

function detectRarity(cardNumber: string): 'SR' | 'AR' | 'SAR' {
  const [current, total] = cardNumber.split('/').map(Number);
  
  if (current > 100 && total === 80) return 'SAR';
  if (current > 80 && total === 80) return 'AR';
  return 'SR';
}

// Configuration - Add your sets here
const CONFIG = {
  sets: ['M3', 'SV9', 'SV8a', 'SV8', 'SV7'], // Add more sets as needed
  minMarginPercent: 20, // Only show opportunities with >20% margin
  outputFile: path.join(process.cwd(), 'data', 'arbitrage-data.json')
};

export async function calculateArbitrageForSets(sets: string[] = CONFIG.sets): Promise<DashboardData> {
  console.log('🚀 Starting arbitrage calculation...');
  console.log(`📦 Sets to process: ${sets.join(', ')}`);
  
  // Check cache stats
  const cacheStats = getCacheStats();
  console.log(`📦 TCGPlayer cache: ${cacheStats.entries} entries, oldest: ${cacheStats.oldestEntry?.toLocaleString() || 'N/A'}`);
  
  // 1. Scrape Japanese prices for all sets
  const allJapaneseCards = await scrapeAllSets(sets);
  
  if (allJapaneseCards.length === 0) {
    console.log('⚠️ No cards found from Japanese sources');
    return {
      opportunities: [],
      lastUpdated: new Date().toISOString(),
      stats: { totalCards: 0, viableOpportunities: 0, avgMargin: 0 }
    };
  }
  
  // 2. Group cards by set + card number
  const cardMap = new Map<string, {
    name: string;
    cardNumber: string;
    set: string;
    rarity: 'SR' | 'AR' | 'SAR';
    japanesePrices: Array<{
      source: 'japan-toreca' | 'torecacamp';
      priceJPY: number;
      priceUSD: number;
      quality?: 'A' | 'A-' | 'B' | null;
      inStock: boolean;
      url: string;
    }>;
  }>();
  
  for (const card of allJapaneseCards) {
    const key = `${card.set}-${card.cardNumber}`;
    const rarity = detectRarity(card.cardNumber);
    
    if (!cardMap.has(key)) {
      cardMap.set(key, {
        name: card.name,
        cardNumber: card.cardNumber,
        set: card.set,
        rarity,
        japanesePrices: []
      });
    }
    
    cardMap.get(key)!.japanesePrices.push({
      source: card.source,
      priceJPY: card.priceJPY,
      priceUSD: card.priceUSD,
      quality: card.quality,
      inStock: card.inStock,
      url: card.url
    });
  }
  
  console.log(`\n🎴 Found ${cardMap.size} unique cards across ${sets.length} sets`);
  
  // 3. Get TCGPlayer prices and calculate arbitrage
  const opportunities: ArbitrageOpportunity[] = [];
  let processedCount = 0;
  
  for (const [key, cardData] of cardMap) {
    processedCount++;
    
    // Skip if no in-stock Japanese prices
    const inStockPrices = cardData.japanesePrices.filter(p => p.inStock);
    if (inStockPrices.length === 0) continue;
    
    // Find lowest Japanese price
    const lowestJapanese = inStockPrices.reduce((min, p) => 
      p.priceUSD < min.priceUSD ? p : min
    );
    
    // Get TCGPlayer price (uses 3-day cache)
    console.log(`[${processedCount}/${cardMap.size}] Fetching TCGPlayer price for ${cardData.name} (${cardData.cardNumber})...`);
    const tcgplayerData = await getTCGPlayerPrice(
      cardData.name, 
      cardData.cardNumber, 
      cardData.rarity
    );
    
    if (!tcgplayerData || tcgplayerData.marketPrice === 0) {
      console.log(`  ⚠️ No TCGPlayer data available`);
      continue;
    }
    
    // Mark which price is lowest
    const markedPrices = cardData.japanesePrices.map(p => ({
      ...p,
      isLowest: p.source === lowestJapanese.source && p.priceUSD === lowestJapanese.priceUSD
    }));
    
    // Calculate margin
    const marginAmount = tcgplayerData.marketPrice - lowestJapanese.priceUSD;
    const marginPercent = Math.round((marginAmount / lowestJapanese.priceUSD) * 100);
    
    // Determine if viable
    const isViable = marginPercent >= CONFIG.minMarginPercent;
    
    opportunities.push({
      id: `${cardData.set}-${cardData.cardNumber}-${cardData.rarity}`,
      name: cardData.name,
      cardNumber: cardData.cardNumber,
      rarity: cardData.rarity,
      set: cardData.set,
      tcgplayer: {
        marketPrice: tcgplayerData.marketPrice,
        sellerCount: tcgplayerData.sellerCount
      },
      japanesePrices: markedPrices,
      lowestJapanesePrice: lowestJapanese.priceUSD,
      marginPercent,
      marginAmount: Math.round(marginAmount * 100) / 100,
      lastUpdated: new Date().toISOString(),
      isViable
    });
  }
  
  // 4. Sort by margin percentage (highest first)
  opportunities.sort((a, b) => b.marginPercent - a.marginPercent);
  
  // 5. Calculate stats
  const viableOpportunities = opportunities.filter(o => o.isViable);
  const avgMargin = viableOpportunities.length > 0
    ? Math.round(viableOpportunities.reduce((sum, o) => sum + o.marginPercent, 0) / viableOpportunities.length)
    : 0;
  
  console.log(`\n✅ Arbitrage calculation complete!`);
  console.log(`📊 Summary:`);
  console.log(`  - Total opportunities: ${opportunities.length}`);
  console.log(`  - Viable opportunities (>${CONFIG.minMarginPercent}%): ${viableOpportunities.length}`);
  console.log(`  - Average viable margin: ${avgMargin}%`);
  
  return {
    opportunities,
    lastUpdated: new Date().toISOString(),
    stats: {
      totalCards: opportunities.length,
      viableOpportunities: viableOpportunities.length,
      avgMargin
    }
  };
}

// Save data to file
export async function generateAndSaveData(sets?: string[]): Promise<void> {
  const data = await calculateArbitrageForSets(sets);
  
  // Ensure directory exists
  const dataDir = path.dirname(CONFIG.outputFile);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Save data
  fs.writeFileSync(CONFIG.outputFile, JSON.stringify(data, null, 2));
  
  console.log(`\n💾 Data saved to: ${CONFIG.outputFile}`);
  
  // Show top 5 opportunities
  if (data.opportunities.length > 0) {
    console.log(`\n🏆 Top 5 Opportunities:`);
    data.opportunities.slice(0, 5).forEach((opp, i) => {
      console.log(`  ${i + 1}. ${opp.name} [${opp.set}] (${opp.cardNumber}) - ${opp.marginPercent}% margin`);
    });
  }
}

// Export config for use in other files
export { CONFIG };