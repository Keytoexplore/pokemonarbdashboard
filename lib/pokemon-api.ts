const INTERNAL_API_BASE = '/api/prices';

// Cache duration: 3 days in seconds
const CACHE_DURATION = 259200;

export interface USPriceData {
  marketPrice: number;
  sellerCount: number;
  listingCount: number;
  currency: string;
  imageUrl?: string;
  imageCdnUrl?: string;
  cardName?: string;
  tcgPlayerUrl?: string;
}

// API Response interfaces matching actual API structure
interface PokemonPrice {
  market: number;
  low: number;
  sellers: number;
  listings: number;
  lastUpdated: string;
}

interface PokemonCardAPI {
  id: string;
  tcgPlayerId: string;
  setId: number;
  setName: string;
  name: string;
  cardNumber: string;
  rarity: string;
  tcgPlayerUrl: string;
  prices: PokemonPrice;
  imageCdnUrl: string;
  imageCdnUrl200: string;
  imageCdnUrl400: string;
  imageUrl: string;
}

interface PokemonAPIResponse {
  data: PokemonCardAPI[];
}

/**
 * Delay function for rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extract card number (remove /XXX suffix)
 */
function extractCardNumber(cardNumber: string): string {
  return cardNumber.split('/')[0];
}

/**
 * Transform API response to USPriceData
 */
function transformApiResponse(card: PokemonCardAPI): USPriceData {
  return {
    marketPrice: card.prices?.market || 0,
    sellerCount: card.prices?.sellers || 0,
    listingCount: card.prices?.listings || 0,
    currency: 'USD',
    imageUrl: card.imageUrl,
    imageCdnUrl: card.imageCdnUrl,
    cardName: card.name,
    tcgPlayerUrl: card.tcgPlayerUrl,
  };
}

/**
 * Fetch US market price for a Pokemon card
 * Uses internal API route with caching and rate limiting
 * @param cardNumber - Card number (e.g., "082/080")
 * @param setCode - Set code (e.g., "S12a")
 * @returns USPriceData with market price information and image URL
 */
export async function fetchUSCardPrice(
  cardNumber: string,
  setCode: string
): Promise<USPriceData | null> {
  try {
    const cardNum = extractCardNumber(cardNumber);
    const url = `${INTERNAL_API_BASE}?set=${encodeURIComponent(setCode)}&number=${encodeURIComponent(cardNum)}`;
    
    console.log(`[PokemonAPI] Fetching US price for ${setCode} ${cardNumber}`);
    
    const response = await fetch(url, {
      next: { revalidate: CACHE_DURATION },
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`[PokemonAPI] No US price found for ${setCode} ${cardNumber}`);
        return null;
      }
      const errorData = await response.json().catch(() => ({}));
      console.error(`[PokemonAPI] API error for ${setCode} ${cardNumber}:`, response.status, errorData);
      return null;
    }

    const apiResponse: PokemonAPIResponse = await response.json();
    console.log(`[PokemonAPI] Response for ${setCode} ${cardNumber}:`, JSON.stringify(apiResponse).slice(0, 200));

    // API returns { data: [...cards] }
    if (apiResponse.data && Array.isArray(apiResponse.data) && apiResponse.data.length > 0) {
      const card = apiResponse.data[0];
      return transformApiResponse(card);
    }

    console.log(`[PokemonAPI] No valid price data found for ${setCode} ${cardNumber}`);
    return null;
  } catch (error) {
    console.error(`[PokemonAPI] Error fetching US price for ${setCode} ${cardNumber}:`, error);
    return null;
  }
}

/**
 * Fetch US prices for multiple cards in batch
 * Uses internal API route with server-side batching
 * @param cards - Array of cards with cardNumber and set
 * @returns Map of card IDs to US price data
 */
export async function fetchUSPricesBatch(
  cards: Array<{ id: string; cardNumber: string; set: string }>
): Promise<Map<string, USPriceData>> {
  const results = new Map<string, USPriceData>();
  
  if (cards.length === 0) {
    return results;
  }
  
  console.log(`[PokemonAPI] Starting batch fetch for ${cards.length} cards`);
  
  try {
    // Use batch API for efficiency
    const response = await fetch(INTERNAL_API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        cards: cards.map(c => ({
          id: c.id,
          set: c.set,
          number: extractCardNumber(c.cardNumber),
        })),
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[PokemonAPI] Batch fetch failed:', response.status, errorData);
      
      // Fallback to individual fetches
      console.log('[PokemonAPI] Falling back to individual fetches...');
      for (const card of cards) {
        try {
          const priceData = await fetchUSCardPrice(card.cardNumber, card.set);
          if (priceData) {
            results.set(card.id, priceData);
          }
          // Small delay between fallback requests
          await delay(100);
        } catch (e) {
          console.error(`[PokemonAPI] Failed to fetch ${card.id}:`, e);
        }
      }
      return results;
    }
    
    const data = await response.json();
    
    if (data.results) {
      for (const [id, cardData] of Object.entries(data.results)) {
        const apiResponse = cardData as PokemonAPIResponse;
        if (apiResponse.data && apiResponse.data.length > 0) {
          results.set(id, transformApiResponse(apiResponse.data[0]));
        }
      }
    }
    
    if (data.errors && Object.keys(data.errors).length > 0) {
      console.log('[PokemonAPI] Some cards failed:', data.errors);
    }
    
  } catch (error) {
    console.error('[PokemonAPI] Batch request failed:', error);
    
    // Fallback to individual fetches
    for (const card of cards) {
      try {
        const priceData = await fetchUSCardPrice(card.cardNumber, card.set);
        if (priceData) {
          results.set(card.id, priceData);
        }
        await delay(100);
      } catch (e) {
        console.error(`[PokemonAPI] Failed to fetch ${card.id}:`, e);
      }
    }
  }
  
  console.log(`[PokemonAPI] Batch fetch complete. Got prices for ${results.size}/${cards.length} cards`);
  return results;
}

/**
 * Fetch card image URL from the API
 */
export async function fetchCardImage(
  cardNumber: string,
  setCode: string
): Promise<string | null> {
  const priceData = await fetchUSCardPrice(cardNumber, setCode);
  return priceData?.imageCdnUrl || priceData?.imageUrl || null;
}

/**
 * Fallback US prices for when API is unavailable
 * These are cached from previous successful fetches
 */
export const fallbackUSPrices: Record<string, USPriceData> = {
  // Fallback prices will be populated after successful API calls
};
