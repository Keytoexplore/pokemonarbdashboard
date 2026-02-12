const API_BASE_URL = 'https://www.pokemonpricetracker.com/api/v2';
const API_KEY = 'pokeprice_free_67abf1594acce302cdbaaf1339c9234cbc402f5726e95cd7';

// Cache duration: 3 days in seconds
const CACHE_DURATION = 259200;

export interface USPriceData {
  marketPrice: number;
  sellerCount: number;
  listingCount: number;
  currency: string;
  imageUrl?: string;
  cardName?: string;
}

export interface CardAPIData {
  id: string;
  name: string;
  number: string;
  set: string;
  rarity?: string;
  imageUrl?: string;
  marketPrice?: number;
  price?: number;
  sellerCount?: number;
  sellers?: number;
  listingCount?: number;
  listings?: number;
  currency?: string;
}

/**
 * Fetch US market price for a Pokemon card with ISR caching
 * Uses Authorization header with Bearer token
 * @param cardNumber - Card number (e.g., "082/080")
 * @param setCode - Set code (e.g., "M3")
 * @returns USPriceData with market price information and image URL
 */
export async function fetchUSCardPrice(
  cardNumber: string,
  setCode: string
): Promise<USPriceData | null> {
  try {
    // Construct the card number format expected by the API
    // Remove the /XXX suffix for the query
    const cardNum = cardNumber.split('/')[0];
    
    // Build the API URL with query parameters
    const params = new URLSearchParams({
      set: setCode,
      number: cardNum,
    });

    const url = `${API_BASE_URL}/cards?${params.toString()}`;
    
    console.log(`Fetching US price for ${setCode} ${cardNumber} from ${url}`);
    
    // Use Next.js fetch with ISR caching - cached for 3 days
    // API key must be in Authorization header as Bearer token
    const response = await fetch(url, {
      next: { revalidate: CACHE_DURATION },
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`No US price found for ${setCode} ${cardNumber}`);
        return null;
      }
      if (response.status === 401) {
        console.error(`API authentication failed for ${setCode} ${cardNumber}`);
        return null;
      }
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`API response for ${setCode} ${cardNumber}:`, JSON.stringify(data).slice(0, 200));

    // Handle array response (list of cards)
    if (Array.isArray(data) && data.length > 0) {
      const card = data[0] as CardAPIData;
      return {
        marketPrice: card.marketPrice || card.price || 0,
        sellerCount: card.sellerCount || card.sellers || 0,
        listingCount: card.listingCount || card.listings || 0,
        currency: card.currency || 'USD',
        imageUrl: card.imageUrl,
        cardName: card.name,
      };
    }

    // Handle { card: {...} } or { data: {...} } wrapper
    if (data.card || data.data) {
      const card = (data.card || data.data) as CardAPIData;
      return {
        marketPrice: card.marketPrice || card.price || 0,
        sellerCount: card.sellerCount || card.sellers || 0,
        listingCount: card.listingCount || card.listings || 0,
        currency: card.currency || 'USD',
        imageUrl: card.imageUrl,
        cardName: card.name,
      };
    }

    // If response has direct price data (single card object)
    if (data.marketPrice !== undefined || data.price !== undefined) {
      const card = data as CardAPIData;
      return {
        marketPrice: card.marketPrice || card.price || 0,
        sellerCount: card.sellerCount || card.sellers || 0,
        listingCount: card.listingCount || card.listings || 0,
        currency: card.currency || 'USD',
        imageUrl: card.imageUrl,
        cardName: card.name,
      };
    }

    console.log(`No valid price data found in response for ${setCode} ${cardNumber}`);
    return null;
  } catch (error) {
    console.error(`Error fetching US price for ${setCode} ${cardNumber}:`, error);
    return null;
  }
}

/**
 * Fetch US prices for multiple cards in batch with rate limiting
 * Processes one card at a time with 1 second delay to stay within API limits
 * @param cards - Array of cards with cardNumber and set
 * @returns Map of card IDs to US price data
 */
export async function fetchUSPricesBatch(
  cards: Array<{ id: string; cardNumber: string; set: string }>
): Promise<Map<string, USPriceData>> {
  const results = new Map<string, USPriceData>();
  
  console.log(`Starting batch fetch for ${cards.length} cards`);
  
  // Process sequentially with delay to respect rate limits
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    
    try {
      const priceData = await fetchUSCardPrice(card.cardNumber, card.set);
      if (priceData) {
        results.set(card.id, priceData);
        console.log(`✓ Fetched US price for ${card.id}: $${priceData.marketPrice}`);
      } else {
        console.log(`✗ No US price data for ${card.id}`);
      }
    } catch (error) {
      console.error(`Failed to fetch price for ${card.id}:`, error);
    }
    
    // Wait 1 second between requests to stay within API limits
    if (i < cards.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`Batch fetch complete. Got prices for ${results.size}/${cards.length} cards`);
  return results;
}

/**
 * Fetch card image URL from the API
 * This can be used to get the proper card image
 */
export async function fetchCardImage(
  cardNumber: string,
  setCode: string
): Promise<string | null> {
  try {
    const cardNum = cardNumber.split('/')[0];
    const params = new URLSearchParams({
      set: setCode,
      number: cardNum,
    });

    const url = `${API_BASE_URL}/cards?${params.toString()}`;
    
    const response = await fetch(url, {
      next: { revalidate: CACHE_DURATION },
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      return data[0].imageUrl || null;
    }
    
    if (data.card?.imageUrl) {
      return data.card.imageUrl;
    }
    
    if (data.data?.imageUrl) {
      return data.data.imageUrl;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching card image for ${setCode} ${cardNumber}:`, error);
    return null;
  }
}

/**
 * Fallback US prices for when API is unavailable
 * These are cached from previous successful fetches
 */
export const fallbackUSPrices: Record<string, USPriceData> = {
  // Fallback prices will be populated after successful API calls
};
