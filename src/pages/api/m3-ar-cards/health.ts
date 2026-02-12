// Next.js API route for getting M3 AR card health
import { NextApiRequest, NextApiResponse } from 'next';
import { getHealth } from '@/lib/api/m3-ar-cards-api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const response = await getHealth();
    
    if (response.success) {
      res.status(200).json(response);
    } else {
      res.status(400).json(response);
    }
  } catch (error) {
    console.error('❌ Health Check Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}

export { getHealth } from '@/lib/api/m3-ar-cards-api';