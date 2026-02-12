import { M3ARCardManager, m3ARCardManager } from './m3-ar-cards';
import { CardData } from '../scrapers';

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

export async function initializeAPI(): Promise<APIResponse> {
  try {
    console.log('Initializing M3 AR Card API...');
    await m3ARCardManager.initialize();
    console.log('✅ API initialized successfully');
    return {
      success: true,
      message: 'M3 AR Card API initialized successfully',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error initializing API:', error);
    return {
      success: false,
      error: 'Failed to initialize M3 AR Card API',
      timestamp: new Date().toISOString()
    };
  }
}

export async function fetchAllCards(): Promise<CardDataResponse> {
  try {
    console.log('Fetching all M3 AR cards...');
    
    const cards = m3ARCardManager.getCards();
    const stats = {
      total: cards.length,
      withPrices: cards.filter(card => card.currentPrice !== null).length,
      withoutPrices: cards.filter(card => card.currentPrice === null).length
    };

    console.log('✅ Fetched ${cards.length} cards');
    return {
      success: true,
      data: cards,
      stats,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error fetching cards:', error);
    return {
      success: false,
      error: 'Failed to fetch M3 AR cards',
      timestamp: new Date().toISOString()
    };
  }
}

export async function fetchCard(cardNumber: string): Promise<CardDataResponse> {
  try {
    console.log('Fetching card ${cardNumber}...');
    
    const card = m3ARCardManager.getCard(cardNumber);
    if (!card) {
      return {
        success: false,
        error: 'Card not found',
        timestamp: new Date().toISOString()
      };
    }

    console.log('✅ Fetched card ${cardNumber}');
    return {
      success: true,
      data: [card],
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error fetching card ${cardNumber}:', error);
    return {
      success: false,
      error: 'Failed to fetch card',
      timestamp: new Date().toISOString()
    };
  }
}

export async function fetchCardsWithPrices(): Promise<CardDataResponse> {
  try {
    console.log('Fetching cards with prices...');
    
    const cards = m3ARCardManager.getCardsWithPrices();
    const stats = {
      total: cards.length,
      withPrices: cards.length,
      withoutPrices: 0
    };

    console.log('✅ Fetched ${cards.length} cards with prices');
    return {
      success: true,
      data: cards,
      stats,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error fetching cards with prices:', error);
    return {
      success: false,
      error: 'Failed to fetch cards with prices',
      timestamp: new Date().toISOString()
    };
  }
}

export async function fetchCardsWithoutPrices(): Promise<CardDataResponse> {
  try {
    console.log('Fetching cards without prices...');
    
    const cards = m3ARCardManager.getCardsWithoutPrices();
    const stats = {
      total: cards.length,
      withPrices: 0,
      withoutPrices: cards.length
    };

    console.log('✅ Fetched ${cards.length} cards without prices');
    return {
      success: true,
      data: cards,
      stats,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error fetching cards without prices:', error);
    return {
      success: false,
      error: 'Failed to fetch cards without prices',
      timestamp: new Date().toISOString()
    };
  }
}

export async function fetchCacheStats(): Promise<CacheStatsResponse> {
  try {
    console.log('Fetching cache statistics...');
    
    const stats = m3ARCardManager.getCacheStats();

    console.log('✅ Fetched cache stats');
    return {
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error fetching cache stats:', error);
    return {
      success: false,
      error: 'Failed to fetch cache statistics',
      timestamp: new Date().toISOString()
    };
  }
}

export async function refreshAPIData(): Promise<APIResponse> {
  try {
    console.log('Refreshing API data...');
    
    await m3ARCardManager.fetchAPIData();
    await m3ARCardManager.updatePrices();

    console.log('✅ API data refreshed successfully');
    return {
      success: true,
      message: 'API data refreshed successfully',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error refreshing API data:', error);
    return {
      success: false,
      error: 'Failed to refresh API data',
      timestamp: new Date().toISOString()
    };
  }
}

export async function saveDataToFile(): Promise<APIResponse> {
  try {
    console.log('Saving data to file...');
    
    const filePath = await m3ARCardManager.saveToFiles();

    console.log('✅ Data saved to ${filePath}');
    return {
      success: true,
      message: 'Data saved successfully',
      data: { filePath },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error saving data to file:', error);
    return {
      success: false,
      error: 'Failed to save data to file',
      timestamp: new Date().toISOString()
    };
  }
}

export async function processBatch(cardNumbers: string[]): Promise<CardDataResponse> {
  try {
    console.log('Processing batch of ${cardNumbers.length} cards...');
    
    const cards = cardNumbers
      .map(number => m3ARCardManager.getCard(number))
      .filter((card): card is M3ARCard => card !== undefined);

    console.log('✅ Processed batch');
    return {
      success: true,
      data: cards,
      stats: {
        total: cards.length,
        withPrices: cards.filter(card => card.currentPrice !== null).length,
        withoutPrices: cards.filter(card => card.currentPrice === null).length
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error processing batch:', error);
    return {
      success: false,
      error: 'Failed to process batch',
      timestamp: new Date().toISOString()
    };
  }
}

export async function searchCards(query: string): Promise<CardDataResponse> {
  try {
    console.log('Searching cards for query: ${query}...');
    
    const cards = m3ARCardManager.getCards().filter(card => 
      card.name.toLowerCase().includes(query.toLowerCase()) ||
      card.cardNumber.includes(query)
    );

    console.log('✅ Found ${cards.length} matching cards');
    return {
      success: true,
      data: cards,
      stats: {
        total: cards.length,
        withPrices: cards.filter(card => card.currentPrice !== null).length,
        withoutPrices: cards.filter(card => card.currentPrice === null).length
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error searching cards:', error);
    return {
      success: false,
      error: 'Failed to search cards',
      timestamp: new Date().toISOString()
    };
  }
}

export async function clearCache(): Promise<APIResponse> {
  try {
    console.log('Clearing cache...');
    
    // Clear cache by creating a new manager instance
    m3ARCardManager = new M3ARCardManager();
    await m3ARCardManager.initialize();

    console.log('✅ Cache cleared successfully');
    return {
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    return {
      success: false,
      error: 'Failed to clear cache',
      timestamp: new Date().toISOString()
    };
  }
}

export async function getHealth(): Promise<APIResponse> {
  try {
    console.log('Checking API health...');
    
    const cards = m3ARCardManager.getCards();
    const cardsWithPrices = cards.filter(card => card.currentPrice !== null).length;
    const cacheStats = m3ARCardManager.getCacheStats();

    console.log('✅ API is healthy');
    return {
      success: true,
      message: 'API is healthy',
      data: {
        totalCards: cards.length,
        cardsWithPrices,
        cacheStats
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error checking API health:', error);
    return {
      success: false,
      error: 'Failed to check API health',
      timestamp: new Date().toISOString()
    };
  }
}

// API Endpoints for Next.js API routes
export const apiHandlers = {
  GET: {
    '/initialize': initializeAPI,
    '/cards': fetchAllCards,
    '/cards/:cardNumber': async (req: any) => {
      const { cardNumber } = req.query;
      return fetchCard(cardNumber);
    },
    '/cards/with-prices': fetchCardsWithPrices,
    '/cards/without-prices': fetchCardsWithoutPrices,
    '/cache/stats': fetchCacheStats,
    '/health': getHealth
  },
  POST: {
    '/refresh': refreshAPIData,
    '/save': saveDataToFile,
    '/batch': async (req: any) => {
      const { cardNumbers } = req.body;
      return processBatch(cardNumbers);
    },
    '/search': async (req: any) => {
      const { query } = req.body;
      return searchCards(query);
    },
    '/clear-cache': clearCache
  }
} as const;