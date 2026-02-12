// Simple, focused types for Pokemon arbitrage

export interface JapanesePrice {
  source: 'japan-toreca' | 'torecacamp';
  priceJPY: number;
  priceUSD: number;
  quality?: 'A' | 'A-' | 'B' | null;
  inStock: boolean;
  isLowest: boolean;
  url: string;
}

export interface TCGPlayerPrice {
  marketPrice: number;
  sellerCount: number;
}

export interface ArbitrageOpportunity {
  id: string;
  name: string;
  cardNumber: string;
  rarity: 'SR' | 'AR' | 'SAR';
  set: string;
  imageUrl?: string;
  
  // Prices
  tcgplayer: TCGPlayerPrice;
  japanesePrices: JapanesePrice[];
  
  // Calculated metrics
  lowestJapanesePrice: number; // in USD
  marginPercent: number;
  marginAmount: number;
  
  // Status
  lastUpdated: string;
  isViable: boolean; // margin > 20%
}

export interface DashboardData {
  opportunities: ArbitrageOpportunity[];
  lastUpdated: string;
  stats: {
    totalCards: number;
    viableOpportunities: number;
    avgMargin: number;
  };
}
