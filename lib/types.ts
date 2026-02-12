export interface JapanesePrice {
  source: 'japan-toreca' | 'torecacamp';
  priceJPY: number;
  priceUSD: number;
  quality?: string | null;
  inStock: boolean;
  url: string;
  isLowest: boolean;
}

export interface TCGPlayerData {
  marketPrice: number;
  sellerCount: number;
}

export interface USMarketData {
  marketPrice: number;
  sellerCount: number;
  listingCount: number;
  currency: string;
}

export interface ArbitrageUSData {
  profitAmount: number;
  profitPercent: number;
  japanPriceUSD: number;
  usMarketPrice: number;
  isViable: boolean;
}

export interface ArbitrageOpportunity {
  id: string;
  name: string;
  cardNumber: string;
  rarity: 'SR' | 'AR' | 'SAR';
  set: string;
  tcgplayer: TCGPlayerData;
  japanesePrices: JapanesePrice[];
  lowestJapanesePrice: number;
  usPrice: USMarketData | null;
  arbitrageUS: ArbitrageUSData | null;
  marginPercent: number;
  marginAmount: number;
  lastUpdated: string;
  isViable: boolean;
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