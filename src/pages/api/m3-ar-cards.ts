// Next.js API route for M3 AR Card API
import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandlers } from '@/lib/api/m3-ar-cards-api';
import { initializeAPI } from '@/lib/api/m3-ar-cards-api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Initialize API on first request
    await initializeAPI();

    const method = req.method as keyof typeof apiHandlers.GET;
    const handler = apiHandlers[method as keyof typeof apiHandlers]?.[req.query.endpoint as string];

    if (handler) {
      const response = await handler(req);
      
      if (response.success) {
        res.status(200).json(response);
      } else {
        res.status(400).json(response);
      }
    } else {
      res.status(404).json({
        success: false,
        error: `Endpoint not found: ${req.method} ${req.url}`,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}

// Export individual handlers for testing
export {
  initializeAPI,
  fetchAllCards,
  fetchCard,
  fetchCardsWithPrices,
  fetchCardsWithoutPrices,
  fetchCacheStats,
  refreshAPIData,
  saveDataToFile,
  processBatch,
  searchCards,
  clearCache,
  getHealth
} from '@/lib/api/m3-ar-cards-api';