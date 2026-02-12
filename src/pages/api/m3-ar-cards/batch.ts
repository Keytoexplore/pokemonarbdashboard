// Next.js API route for processing a batch of M3 AR cards
import { NextApiRequest, NextApiResponse } from 'next';
import { processBatch } from '@/lib/api/m3-ar-cards-api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { cardNumbers } = req.body;
    
    if (!cardNumbers || !Array.isArray(cardNumbers)) {
      return res.status(400).json({
        success: false,
        error: 'cardNumbers array is required',
        timestamp: new Date().toISOString()
      });
    }

    const response = await processBatch(cardNumbers);
    
    if (response.success) {
      res.status(200).json(response);
    } else {
      res.status(400).json(response);
    }
  } catch (error) {
    console.error('❌ Batch Process Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}

export { processBatch } from '@/lib/api/m3-ar-cards-api';