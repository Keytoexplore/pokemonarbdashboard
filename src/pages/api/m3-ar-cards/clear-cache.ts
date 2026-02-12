// Next.js API route for clearing M3 AR card cache
import { NextApiRequest, NextApiResponse } from 'next';
import { clearCache } from '@/lib/api/m3-ar-cards-api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify authorization
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        timestamp: new Date().toISOString()
      });
    }

    const response = await clearCache();
    
    if (response.success) {
      res.status(200).json(response);
    } else {
      res.status(400).json(response);
    }
  } catch (error) {
    console.error('❌ Clear Cache Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}

export { clearCache } from '@/lib/api/m3-ar-cards-api';