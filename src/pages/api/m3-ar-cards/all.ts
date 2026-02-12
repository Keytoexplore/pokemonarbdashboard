// Next.js API route for getting all cards
import { NextApiRequest, NextApiResponse } from 'next';
import { fetchAllCards } from '@/lib/api/m3-ar-cards-api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const response = await fetchAllCards();
    
    if (response.success) {
      res.status(200).json(response);
    } else {
      res.status(400).json(response);
    }
  } catch (error) {
    console.error('❌ All Cards Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}

export { fetchAllCards } from '@/lib/api/m3-ar-cards-api';