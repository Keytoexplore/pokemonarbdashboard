// Next.js API route for testing M3 AR card API
import { NextApiRequest, NextApiResponse } from 'next';
import { getHealth, fetchAllCards } from '@/lib/api/m3-ar-cards-api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Run basic health check and fetch sample data
    const [healthResponse, cardsResponse] = await Promise.all([
      getHealth(),
      fetchAllCards()
    ]);

    res.status(200).json({
      success: true,
      message: 'API is working correctly',
      health: healthResponse,
      sampleData: {
        totalCards: cardsResponse.stats?.total || 0,
        cardsWithPrices: cardsResponse.stats?.withPrices || 0,
        cacheStats: cardsResponse.data?.[0]?.apiData?.length || 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Test Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}

export { getHealth, fetchAllCards } from '@/lib/api/m3-ar-cards-api';