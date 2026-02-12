import { scrapeM3ARCards, CardData } from './scrapers';
import { cardStorage, CardRecord } from './storage';

export interface DashboardCard {
  id: string;
  name: string;
  cardNumber: string;
  imageUrl?: string;
  prices: {
    qualityA?: {
      price: number;
      stock: number | null;
      availability: 'in_stock' | 'out_of_stock';
      sources: Array<{ source: string; price: number; url: string }>;
    };
    qualityAMinus?: {
      price: number;
      stock: number | null;
      availability: 'in_stock' | 'out_of_stock';
      sources: Array<{ source: string; price: number; url: string }>;
    };
    qualityB?: {
      price: number;
      stock: number | null;
      availability: 'in_stock' | 'out_of_stock';
      sources: Array<{ source: string; price: number; url: string }>;
    };
  };
  lowestPrice: number;
  lowestPriceQuality: string;
  lowestPriceSource: string;
  priceHistory?: Array<{
    date: string;
    price: number;
    availability: string;
  }>;
  lastUpdated: string;
}

export async function generateDashboardData(): Promise<DashboardCard[]> {
  console.log('🎨 Generating dashboard data...');
  
  // 1. Scrape fresh data
  const scrapedResults = await scrapeM3ARCards();
  const allCards: CardData[] = scrapedResults.flatMap(r => r.cards);
  
  // 2. Save current data and update history
  await cardStorage.saveCurrentCards(allCards);
  await cardStorage.updatePriceHistory(allCards);
  
  // 3. Get historical data
  const cardsWithHistory = await cardStorage.getAllCardsWithHistory();
  
  // 4. Group by card number
  const cardsByNumber: Record<string, CardRecord[]> = {};
  
  for (const card of cardsWithHistory) {
    if (!cardsByNumber[card.cardNumber]) {
      cardsByNumber[card.cardNumber] = [];
    }
    cardsByNumber[card.cardNumber].push(card);
  }
  
  // 5. Build dashboard cards
  const dashboardCards: DashboardCard[] = [];
  
  for (const [cardNumber, cards] of Object.entries(cardsByNumber)) {
    const name = cards[0].name;
    
    // Group by quality
    const qualityGroups = {
      A: cards.filter(c => c.quality === 'A'),
      'A-': cards.filter(c => c.quality === 'A-'),
      B: cards.filter(c => c.quality === 'B')
    };
    
    const prices: DashboardCard['prices'] = {};
    
    // Process each quality
    for (const [quality, qualityCards] of Object.entries(qualityGroups)) {
      if (qualityCards.length === 0) continue;
      
      const inStockCards = qualityCards.filter(c => c.availability === 'in_stock');
      const allQualityCards = qualityCards.length > 0 ? qualityCards : inStockCards;
      
      if (allQualityCards.length === 0) continue;
      
      // Find lowest price for this quality
      const lowestPriceCard = allQualityCards.reduce((lowest, card) => {
        return card.price < lowest.price ? card : lowest;
      });
      
      // Get sources for this quality
      const sources = qualityCards.map(c => ({
        source: c.source,
        price: c.price,
        url: c.url
      }));
      
      const qualityKey = quality === 'A-' ? 'qualityAMinus' : 
                         quality === 'A' ? 'qualityA' : 'qualityB';
      
      prices[qualityKey as keyof typeof prices] = {
        price: lowestPriceCard.price,
        stock: lowestPriceCard.stock,
        availability: lowestPriceCard.availability,
        sources
      };
    }
    
    // Find overall lowest price
    const allPrices = Object.values(prices).filter(p => p !== undefined);
    if (allPrices.length === 0) continue;
    
    const lowestPriceEntry = allPrices.reduce((lowest, current) => {
      return current!.price < lowest!.price ? current : lowest;
    });
    
    const lowestPriceQuality = 
      prices.qualityA?.price === lowestPriceEntry!.price ? 'A' :
      prices.qualityAMinus?.price === lowestPriceEntry!.price ? 'A-' : 'B';
    
    const lowestPriceSource = lowestPriceEntry!.sources[0].source;
    
    // Get price history (last 30 days)
    const priceHistory = cards[0].priceHistory
      .slice(-30)
      .map(h => ({
        date: h.timestamp,
        price: h.price,
        availability: h.availability
      }));
    
    dashboardCards.push({
      id: `m3-${cardNumber}`,
      name,
      cardNumber,
      prices,
      lowestPrice: lowestPriceEntry!.price,
      lowestPriceQuality,
      lowestPriceSource,
      priceHistory,
      lastUpdated: new Date().toISOString()
    });
  }
  
  console.log(`✅ Generated ${dashboardCards.length} dashboard cards`);
  return dashboardCards;
}

export async function getDashboardSummary() {
  const cards = await generateDashboardData();
  
  const totalCards = cards.length;
  const avgPrice = cards.reduce((sum, c) => sum + c.lowestPrice, 0) / totalCards;
  const inStockCount = cards.filter(c => {
    return Object.values(c.prices).some(p => p?.availability === 'in_stock');
  }).length;
  const outOfStockCount = totalCards - inStockCount;
  
  const priceRanges = {
    under300: cards.filter(c => c.lowestPrice < 300).length,
    '300to500': cards.filter(c => c.lowestPrice >= 300 && c.lowestPrice < 500).length,
    '500to1000': cards.filter(c => c.lowestPrice >= 500 && c.lowestPrice < 1000).length,
    over1000: cards.filter(c => c.lowestPrice >= 1000).length
  };
  
  return {
    totalCards,
    avgPrice: Math.round(avgPrice),
    inStockCount,
    outOfStockCount,
    priceRanges,
    lastUpdated: new Date().toISOString()
  };
}
