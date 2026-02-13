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
  imageUrl?: string;
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
