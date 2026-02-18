export type PriceSource = 'japan-toreca';

export type RarityCode = 'AR' | 'SAR' | 'SR' | 'CHR' | 'UR' | 'SSR' | 'RRR';

export type JapaneseCondition = 'A-' | 'B';

export interface JapanesePrice {
  source: PriceSource;
  priceJPY: number;
  priceUSD: number;
  quality?: JapaneseCondition | string | null;
  inStock: boolean;
  url: string;
  isLowest: boolean;
}

export interface LastKnownPrice {
  priceJPY: number;
  priceUSD: number;
  quality: JapaneseCondition | string;
  date: string;
  inStock: boolean;
  source: PriceSource;
  url: string;
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
  imageUrl?: string;
  imageCdnUrl?: string;
  cardName?: string;
  tcgPlayerUrl?: string;
}

// API Response types based on actual API testing
export interface PokemonPrice {
  market: number;
  low: number;
  sellers: number;
  listings: number;
  lastUpdated: string;
}

export interface PokemonCardAPI {
  id: string;
  tcgPlayerId: string;
  setId: number;
  setName: string;
  name: string;
  cardNumber: string;
  rarity: string;
  tcgPlayerUrl: string;
  prices: PokemonPrice;
  imageCdnUrl: string;
  imageCdnUrl200: string;
  imageCdnUrl400: string;
  imageUrl: string;
}

export interface PokemonAPIResponse {
  data: PokemonCardAPI[];
}

export interface ArbitrageUSData {
  profitAmount: number;
  profitPercent: number;
  japanPriceUSD: number;
  usMarketPrice: number;
  isViable: boolean;
  isPotential?: boolean; // True if based on last known price (out of stock)
}

export interface ArbitrageOpportunity {
  id: string;
  name: string;
  cardNumber: string;
  rarity: RarityCode;
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
  imageUrl?: string;
  lastKnownPrice?: LastKnownPrice | null; // Last known price when all JP sources are out of stock
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
