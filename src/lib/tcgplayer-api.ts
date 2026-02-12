import axios from 'axios';

const API_KEY = process.env.POKEMON_PRICE_TRACKER_API_KEY || '';
const BASE_URL = 'https://www.pokemonpricetracker.com/api/v2';

export interface TCGPlayerData {
  marketPrice: number;
  sellerCount: number;
  listingCount: number;
}

// Simple cache to avoid repeated API calls
const cache = new Map<string, { data: TCGPlayerData; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getTCGPlayerPrice(
  cardName: string, 
  cardNumber: string,
  rarity: 'SR' | 'AR' | 'SAR'
): Promise<TCGPlayerData | null> {
  const cacheKey = `${cardName}-${cardNumber}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  try {
    // Map our rarity to API rarity format
    const rarityMap = {
      'SR': 'Super Rare',
      'AR': 'Art Rare', 
      'SAR': 'Special Art Rare'
    };
    
    const response = await axios.get(`${BASE_URL}/cards`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      params: {
        search: cardName,
        cardNumber: cardNumber,
        rarity: rarityMap[rarity]
      }
    });
    
    if (response.data?.data?.length > 0) {
      const card = response.data.data[0];
      const data: TCGPlayerData = {
        marketPrice: card.prices?.market || card.prices?.tcgplayer || 0,
        sellerCount: card.sellerCount || 0,
        listingCount: card.listingCount || 0
      };
      
      cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching TCGPlayer price for ${cardName}:`, error);
    return null;
  }
}

// Batch processing with rate limiting
export async function getTCGPlayerPricesBatch(
  cards: Array<{ name: string; cardNumber: string; rarity: 'SR' | 'AR' | 'SAR' }>
): Promise<Map<string, TCGPlayerData>> {
  const results = new Map<string, TCGPlayerData>();
  
  for (const card of cards) {
    const data = await getTCGPlayerPrice(card.name, card.cardNumber, card.rarity);
    if (data) {
      results.set(card.cardNumber, data);
    }
    
    // Rate limiting: 1 request per second
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}
