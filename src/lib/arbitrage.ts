import { scrapeAllSets } from './scraper';
import { getTCGPlayerPrice, getCacheStats } from './tcgplayer-api';
import { getCardMapping } from './card-mappings';
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

// Configuration
const CONFIG = {
  sets: ['M3'], // Japanese sets to scrape
  minMarginPercent: 20,
  outputFile: path.join(process.cwd(), 'data', 'arbitrage-data.json'),
  useTCGPlayer: false // Set to true when you have English card number mappings
};

export async function calculateArbitrageForSets(sets: string[] = CONFIG.sets): Promise<DashboardData> {
  console.log('🚀 Starting arbitrage calculation...');
  console.log(`📦 Sets to process: ${sets.join(', ')}`);
  
  // Check cache stats
  const cacheStats = getCacheStats();
  console.log(`📦 TCGPlayer cache: ${cacheStats.entries} entries`);
  
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
    englishName: string | null;
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
    
    const mapping = getCardMapping(card.cardNumber, card.set);
    const englishName = mapping?.englishName || null;
    
    if (!cardMap.has(key)) {
      cardMap.set(key, {
        name: card.name,
        englishName,
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
  
  console.log(`\n🎴 Found ${cardMap.size} unique cards`);
  
  // 3. Process each card (with or without TCGPlayer)
  const opportunities: ArbitrageOpportunity[] = [];
  let processedCount = 0;
  
  for (const [key, cardData] of cardMap) {
    processedCount++;
    
    const inStockPrices = cardData.japanesePrices.filter(p => p.inStock);
    if (inStockPrices.length === 0) continue;
    
    const lowestJapanese = inStockPrices.reduce((min, p) => 
      p.priceUSD < min.priceUSD ? p : min
    );
    
    // Mark lowest price
    const markedPrices = cardData.japanesePrices.map(p => ({
      ...p,
      isLowest: p.source === lowestJapanese.source && p.priceUSD === lowestJapanese.priceUSD
    }));
    
    let tcgplayerData = null;
    let marginPercent = 0;
    let marginAmount = 0;
    
    // Only fetch TCGPlayer if enabled and we have English name
    if (CONFIG.useTCGPlayer && cardData.englishName) {
      console.log(`[${processedCount}/${cardMap.size}] Fetching TCGPlayer for ${cardData.englishName}...`);
      tcgplayerData = await getTCGPlayerPrice(
        cardData.englishName, 
        cardData.cardNumber, 
        cardData.rarity
      );
      
      if (tcgplayerData && tcgplayerData.marketPrice > 0) {
        marginAmount = tcgplayerData.marketPrice - lowestJapanese.priceUSD;
        marginPercent = Math.round((marginAmount / lowestJapanese.priceUSD) * 100);
      }
    }
    
    const isViable = marginPercent >= CONFIG.minMarginPercent;
    
    opportunities.push({
      id: `${cardData.set}-${cardData.cardNumber}-${cardData.rarity}`,
      name: cardData.name,
      cardNumber: cardData.cardNumber,
      rarity: cardData.rarity,
      set: cardData.set,
      tcgplayer: tcgplayerData ? {
        marketPrice: tcgplayerData.marketPrice,
        sellerCount: tcgplayerData.sellerCount
      } : {
        marketPrice: 0,
        sellerCount: 0
      },
      japanesePrices: markedPrices,
      lowestJapanesePrice: lowestJapanese.priceUSD,
      marginPercent,
      marginAmount: Math.round(marginAmount * 100) / 100,
      lastUpdated: new Date().toISOString(),
      isViable
    });
  }
  
  // Sort by lowest Japanese price (for now, until we have TCGPlayer data)
  opportunities.sort((a, b) => a.lowestJapanesePrice - b.lowestJapanesePrice);
  
  const viableOpportunities = opportunities.filter(o => o.isViable);
  const avgMargin = viableOpportunities.length > 0
    ? Math.round(viableOpportunities.reduce((sum, o) => sum + o.marginPercent, 0) / viableOpportunities.length)
    : 0;
  
  console.log(`\n✅ Processing complete!`);
  console.log(`📊 ${opportunities.length} cards tracked`);
  
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

export async function generateAndSaveData(sets?: string[]): Promise<void> {
  const setsToScrape = sets || CONFIG.sets;
  
  // Scrape raw data first
  const allJapaneseCards = await scrapeAllSets(setsToScrape);
  
  // Save raw scraped data
  const rawDataPath = path.join(process.cwd(), 'data', 'scraped-raw.json');
  const dataDir = path.dirname(CONFIG.outputFile);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(rawDataPath, JSON.stringify(allJapaneseCards, null, 2));
  console.log(`\n💾 Raw scraped data saved to: ${rawDataPath}`);
  
  // Continue with arbitrage calculation
  const data = await calculateArbitrageForSets(sets);
  
  fs.writeFileSync(CONFIG.outputFile, JSON.stringify(data, null, 2));
  
  console.log(`\n💾 Arbitrage data saved to: ${CONFIG.outputFile}`);
  
  if (data.opportunities.length > 0) {
    console.log(`\n🏆 Top 5 Lowest Priced Cards:`);
    data.opportunities.slice(0, 5).forEach((opp, i) => {
      const lowest = opp.japanesePrices.find(p => p.isLowest);
      console.log(`  ${i + 1}. ${opp.name} - ¥${lowest?.priceJPY} (~$${lowest?.priceUSD})`);
    });
  }
}

export { CONFIG };