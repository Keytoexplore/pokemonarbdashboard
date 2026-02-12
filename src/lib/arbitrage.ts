import { scrapeJapanToreca, scrapeTorecaCamp } from './scraper';
import { getTCGPlayerPrice } from './tcgplayer-api';
import { ArbitrageOpportunity, DashboardData } from './types';

const JPY_TO_USD = 0.0065;

// Detect rarity from card number
function detectRarity(cardNumber: string): 'SR' | 'AR' | 'SAR' {
  const [current, total] = cardNumber.split('/').map(Number);
  
  // SAR: usually > 100/080
  if (current > 100 && total === 80) return 'SAR';
  // AR: usually 81-100/080
  if (current > 80 && total === 80) return 'AR';
  // SR: usually <= 80/080
  return 'SR';
}

// Normalize card names for matching
function normalizeName(name: string): string {
  return name.toLowerCase()
    .replace(/[\s\-']/g, '')
    .replace(/ex$/i, '')
    .replace(/gx$/i, '');
}

export async function calculateArbitrage(): Promise<DashboardData> {
  console.log('🚀 Starting arbitrage calculation...');
  
  // 1. Scrape Japanese prices
  const [japanTorecaCards, torecaCampCards] = await Promise.all([
    scrapeJapanToreca(),
    scrapeTorecaCamp()
  ]);
  
  console.log(`📊 Scraped ${japanTorecaCards.length} from Japan-Toreca, ${torecaCampCards.length} from TorecaCamp`);
  
  // 2. Group cards by card number
  const cardMap = new Map<string, {
    name: string;
    cardNumber: string;
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
  
  // Process Japan-Toreca cards
  for (const card of japanTorecaCards) {
    const rarity = detectRarity(card.cardNumber);
    
    if (!cardMap.has(card.cardNumber)) {
      cardMap.set(card.cardNumber, {
        name: card.name,
        cardNumber: card.cardNumber,
        rarity,
        japanesePrices: []
      });
    }
    
    cardMap.get(card.cardNumber)!.japanesePrices.push({
      source: 'japan-toreca',
      priceJPY: card.priceJPY,
      priceUSD: card.priceUSD,
      quality: card.quality,
      inStock: card.inStock,
      url: card.url
    });
  }
  
  // Process TorecaCamp cards
  for (const card of torecaCampCards) {
    const rarity = detectRarity(card.cardNumber);
    
    if (!cardMap.has(card.cardNumber)) {
      cardMap.set(card.cardNumber, {
        name: card.name,
        cardNumber: card.cardNumber,
        rarity,
        japanesePrices: []
      });
    }
    
    cardMap.get(card.cardNumber)!.japanesePrices.push({
      source: 'torecacamp',
      priceJPY: card.priceJPY,
      priceUSD: card.priceUSD,
      quality: card.quality,
      inStock: card.inStock,
      url: card.url
    });
  }
  
  // 3. Get TCGPlayer prices and calculate arbitrage
  const opportunities: ArbitrageOpportunity[] = [];
  
  for (const [cardNumber, cardData] of cardMap) {
    // Skip if no in-stock Japanese prices
    const inStockPrices = cardData.japanesePrices.filter(p => p.inStock);
    if (inStockPrices.length === 0) continue;
    
    // Find lowest Japanese price
    const lowestJapanese = inStockPrices.reduce((min, p) => 
      p.priceUSD < min.priceUSD ? p : min
    );
    
    // Get TCGPlayer price
    const tcgplayerData = await getTCGPlayerPrice(
      cardData.name, 
      cardNumber, 
      cardData.rarity
    );
    
    if (!tcgplayerData || tcgplayerData.marketPrice === 0) {
      console.log(`⚠️ No TCGPlayer data for ${cardData.name} (${cardNumber})`);
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
    
    // Determine if viable (margin > 20%)
    const isViable = marginPercent >= 20;
    
    opportunities.push({
      id: `${cardNumber}-${cardData.rarity}`,
      name: cardData.name,
      cardNumber,
      rarity: cardData.rarity,
      set: 'M3', // Assuming M3 set
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
  
  console.log(`✅ Calculated ${opportunities.length} arbitrage opportunities`);
  console.log(`📊 ${viableOpportunities.length} viable opportunities (margin > 20%)`);
  console.log(`📈 Average viable margin: ${avgMargin}%`);
  
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
