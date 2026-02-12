export interface CardData {
  id: string;
  name: string;
  cardNumber: string;
  price: number;
  priceRange?: { min: number; max: number };
  quality: 'A' | 'A-' | 'B' | null;
  availability: 'in_stock' | 'out_of_stock';
  stock: number | null;
  url: string;
  source: 'japan-toreca' | 'torecacamp';
  lastUpdated: string;
  imageUrl?: string;
}

export interface ScraperResult {
  source: 'japan-toreca' | 'torecacamp';
  cards: CardData[];
  scrapedAt: string;
}

export interface DashboardCard {
  id: string;
  name: string;
  cardNumber: string;
  prices: {
    qualityA?: {
      price: number;
      stock: number | null;
      availability: 'in_stock' | 'out_of_stock';
      sources: Array<{
        source: string;
        price: number;
        url: string;
      }>;
    };
    qualityAMinus?: {
      price: number;
      stock: number | null;
      availability: 'in_stock' | 'out_of_stock';
      sources: Array<{
        source: string;
        price: number;
        url: string;
      }>;
    };
    qualityB?: {
      price: number;
      stock: number | null;
      availability: 'in_stock' | 'out_of_stock';
      sources: Array<{
        source: string;
        price: number;
        url: string;
      }>;
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
  imageUrl?: string;
}

export interface M3ARCard {
  id: string;
  name: string;
  cardNumber: string;
  currentPrice: number | null;
  priceRange: { min: number; max: number } | null;
  rarity: string;
  set: string;
  scraperData: CardData[];
  apiData: any[];
  lastUpdated: string;
  imageUrl?: string;
}

export interface RateLimitInfo {
  requests: number;
  limit: number;
  remaining: number;
  resetTime: Date;
  cardsProcessed: number;
  batchesProcessed: number;
}

export interface APIResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
  timestamp: string;
}

export interface M3ARCardResponse extends APIResponse {
  data?: M3ARCardManager;
}

export interface CardDataResponse extends APIResponse {
  data?: M3ARCard[];
  stats?: {
    total: number;
    withPrices: number;
    withoutPrices: number;
  };
}

export interface CacheStatsResponse extends APIResponse {
  data?: {
    totalEntries: number;
    cacheDuration: string;
    expiredEntries: number;
    validEntries: number;
  };
}