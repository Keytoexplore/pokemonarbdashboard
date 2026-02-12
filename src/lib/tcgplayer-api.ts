import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const API_KEY = process.env.POKEMON_PRICE_TRACKER_API_KEY || '';
const BASE_URL = 'https://www.pokemonpricetracker.com/api/v2';
const CACHE_FILE = path.join(process.cwd(), 'data', 'tcgplayer-cache.json');
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds

export interface TCGPlayerData {
  marketPrice: number;
  sellerCount: number;
  listingCount: number;
}

interface CacheEntry {
  data: TCGPlayerData;
  timestamp: number;
}

// Load cache from disk
function loadCache(): Map<string, CacheEntry> {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      return new Map(Object.entries(data));
    }
  } catch (error) {
    console.error('Error loading cache:', error);
  }
  return new Map();
}

// Save cache to disk
function saveCache(cache: Map<string, CacheEntry>) {
  try {
    const cacheDir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    const data = Object.fromEntries(cache);
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving cache:', error);
  }
}

const memoryCache = loadCache();

export async function getTCGPlayerPrice(
  cardName: string, 
  cardNumber: string,
  rarity: 'SR' | 'AR' | 'SAR'
): Promise<TCGPlayerData | null> {
  const cacheKey = `${cardName}-${cardNumber}`;
  const cached = memoryCache.get(cacheKey);
  
  // Return cached data if less than 3 days old
  if (cached && Date.now() - cached.timestamp < THREE_DAYS_MS) {
    console.log(`📦 Using cached price for ${cardName} (${cardNumber})`);
    return cached.data;
  }
  
  try {
    const rarityMap = {
      'SR': 'Super Rare',
      'AR': 'Art Rare', 
      'SAR': 'Special Art Rare'
    };
    
    console.log(`🌐 Fetching TCGPlayer price for ${cardName} (${cardNumber})...`);
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
      
      // Save to cache
      memoryCache.set(cacheKey, { data, timestamp: Date.now() });
      saveCache(memoryCache);
      
      return data;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching TCGPlayer price for ${cardName}:`, error);
    return null;
  }
}

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

// Clear cache (useful for manual refresh)
export function clearCache() {
  memoryCache.clear();
  if (fs.existsSync(CACHE_FILE)) {
    fs.unlinkSync(CACHE_FILE);
  }
  console.log('✅ TCGPlayer cache cleared');
}

// Get cache stats
export function getCacheStats(): { entries: number; oldestEntry: Date | null } {
  let oldest = Date.now();
  for (const entry of memoryCache.values()) {
    if (entry.timestamp < oldest) {
      oldest = entry.timestamp;
    }
  }
  
  return {
    entries: memoryCache.size,
    oldestEntry: memoryCache.size > 0 ? new Date(oldest) : null
  };
}