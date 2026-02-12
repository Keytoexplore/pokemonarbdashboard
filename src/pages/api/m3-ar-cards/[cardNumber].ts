// Next.js API route for getting specific M3 AR card
import { NextApiRequest, NextApiResponse } from 'next';
import { fetchCard } from '@/lib/api/m3-ar-cards-api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { cardNumber } = req.query;
    
    if (!cardNumber) {
      return res.status(400).json({
        success: false,
        error: 'cardNumber query parameter is required',
        timestamp: new Date().toISOString()
      });
    }

    const response = await fetchCard(cardNumber as string);
    
    if (response.success) {
      res.status(200).json(response);
    } else {
      res.status(400).json(response);
    }
  } catch (error) {
    console.error('❌ Card Fetch Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}

export { fetchCard } from '@/lib/api/m3-ar-cards-api';