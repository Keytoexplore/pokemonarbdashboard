const API_BASE_URL = 'https://www.pokemonpricetracker.com/api/v2';
const API_KEY = 'pokeprice_free_67abf1594acce302cdbaaf1339c9234cbc402f5726e95cd7';

// Cache duration: 3 days in seconds
const CACHE_DURATION = 259200;

export interface USPriceData {
  marketPrice: number;
  sellerCount: number;
  listingCount: number;
  currency: string;
}

/**
 * Fetch US market price for a Pokemon card with ISR caching
 * @param cardNumber - Card number (e.g., "082/080")
 * @param setCode - Set code (e.g., "M3")
 * @returns USPriceData with market price information
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
      apiKey: API_KEY,
    });

    const url = `${API_BASE_URL}/cards?${params.toString()}`;
    
    // Use Next.js fetch with ISR caching - cached for 3 days
    const response = await fetch(url, {
      next: { revalidate: CACHE_DURATION },
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`No US price found for ${setCode} ${cardNumber}`);
        return null;
      }
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Handle different response structures
    if (Array.isArray(data) && data.length > 0) {
      const card = data[0];
      return {
        marketPrice: card.marketPrice || card.price || 0,
        sellerCount: card.sellerCount || card.sellers || 0,
        listingCount: card.listingCount || card.listings || 0,
        currency: card.currency || 'USD',
      };
    }

    if (data.card || data.data) {
      const card = data.card || data.data;
      return {
        marketPrice: card.marketPrice || card.price || 0,
        sellerCount: card.sellerCount || card.sellers || 0,
        listingCount: card.listingCount || card.listings || 0,
        currency: card.currency || 'USD',
      };
    }

    // If response has direct price data
    if (data.marketPrice !== undefined || data.price !== undefined) {
      return {
        marketPrice: data.marketPrice || data.price || 0,
        sellerCount: data.sellerCount || data.sellers || 0,
        listingCount: data.listingCount || data.listings || 0,
        currency: data.currency || 'USD',
      };
    }

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
  
  // Process sequentially with delay to respect rate limits
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    
    try {
      const priceData = await fetchUSCardPrice(card.cardNumber, card.set);
      if (priceData) {
        results.set(card.id, priceData);
      }
    } catch (error) {
      console.error(`Failed to fetch price for ${card.id}:`, error);
    }
    
    // Wait 1 second between requests to stay within API limits
    if (i < cards.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

/**
 * Fallback US prices for when API is unavailable
 * These are cached from previous successful fetches
 */
export const fallbackUSPrices: Record<string, USPriceData> = {
  // Add fallback prices here if needed
  // Format: 'M3-104/080-SAR': { marketPrice: 8.50, sellerCount: 12, listingCount: 15, currency: 'USD' },
};
