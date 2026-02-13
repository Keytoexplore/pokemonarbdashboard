/**
 * Update US prices script
 * Run this to fetch fresh US prices and save to data file
 * Usage: npx ts-node scripts/update-prices.ts
 */

import { baseCardsData } from '../lib/card-data';
import { getApiSetId } from '../lib/set-mappings';
import { ArbitrageOpportunity, USPriceData } from '../lib/types';
import * as fs from 'fs';
import * as path from 'path';

const API_BASE_URL = 'https://www.pokemonpricetracker.com/api/v2';
const API_KEY = process.env.POKEPRICE_API_KEY || 'pokeprice_free_67abf1594acce302cdbaaf1339c9234cbc402f5726e95cd7';

// Rate limiting: 1.1 seconds between requests
const RATE_LIMIT_MS = 1100;
let lastRequestTime = 0;

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
  imageUrl: string;
}

interface PokemonAPIResponse {
  data: PokemonCardAPI[];
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function rateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    const delayMs = RATE_LIMIT_MS - timeSinceLastRequest;
    await delay(delayMs);
  }
  
  lastRequestTime = Date.now();
}

function extractCardNumber(cardNumber: string): string {
  return cardNumber.split('/')[0];
}

async function fetchCardPrice(setCode: string, cardNumber: string): Promise<USPriceData | null> {
  await rateLimit();
  
  const apiSetId = getApiSetId(setCode);
  const cardNum = extractCardNumber(cardNumber);
  
  const params = new URLSearchParams({
    set: apiSetId,
    number: cardNum,
    language: 'japanese',
  });
  
  const url = `${API_BASE_URL}/cards?${params.toString()}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`  No data found for ${setCode} ${cardNumber}`);
        return null;
      }
      if (response.status === 429) {
        console.error(`  Rate limited! Waiting longer...`);
        await delay(5000); // Wait 5 seconds if rate limited
        return fetchCardPrice(setCode, cardNumber); // Retry
      }
      throw new Error(`API error: ${response.status}`);
    }
    
    const data: PokemonAPIResponse = await response.json();
    
    if (data.data && data.data.length > 0) {
      const card = data.data[0];
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
    
    return null;
  } catch (error) {
    console.error(`  Error fetching ${setCode} ${cardNumber}:`, error);
    return null;
  }
}

function calculateArbitrage(
  japanPriceUSD: number,
  usMarketPrice: number
): { profitAmount: number; profitPercent: number; isViable: boolean } {
  const profitAmount = usMarketPrice - japanPriceUSD;
  const profitPercent = japanPriceUSD > 0 ? (profitAmount / japanPriceUSD) * 100 : 0;
  const isViable = profitPercent > 20;

  return {
    profitAmount: Math.round(profitAmount * 100) / 100,
    profitPercent: Math.round(profitPercent * 10) / 10,
    isViable,
  };
}

async function updatePrices() {
  console.log('Starting price update...\n');
  console.log(`Processing ${baseCardsData.length} cards...`);
  console.log('This will take approximately', Math.ceil(baseCardsData.length * 1.1), 'seconds\n');
  
  const updatedCards: ArbitrageOpportunity[] = [];
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < baseCardsData.length; i++) {
    const card = baseCardsData[i];
    console.log(`[${i + 1}/${baseCardsData.length}] ${card.name} (${card.set} ${card.cardNumber})`);
    
    try {
      const usPrice = await fetchCardPrice(card.set, card.cardNumber);
      
      if (usPrice) {
        console.log(`  ✓ US Price: $${usPrice.marketPrice} (${usPrice.sellerCount} sellers)`);
        successCount++;
        
        // Calculate arbitrage
        const lowestJapanPrice = card.japanesePrices.find(p => p.isLowest);
        const japanPriceUSD = lowestJapanPrice?.priceUSD || card.lowestJapanesePrice;
        
        const arbitrage = calculateArbitrage(japanPriceUSD, usPrice.marketPrice);
        
        updatedCards.push({
          ...card,
          usPrice,
          arbitrageUS: {
            ...arbitrage,
            japanPriceUSD,
            usMarketPrice: usPrice.marketPrice,
          },
          imageUrl: usPrice.imageCdnUrl || usPrice.imageUrl || card.imageUrl,
          marginPercent: arbitrage.profitPercent,
          marginAmount: arbitrage.profitAmount,
          isViable: arbitrage.isViable,
          lastUpdated: new Date().toISOString(),
        });
      } else {
        console.log(`  ✗ No US price data`);
        failCount++;
        updatedCards.push(card);
      }
    } catch (error) {
      console.log(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
      failCount++;
      updatedCards.push(card);
    }
  }
  
  // Sort by profit margin
  updatedCards.sort((a, b) => (b.marginPercent || 0) - (a.marginPercent || 0));
  
  // Save to file
  const outputPath = path.join(__dirname, '..', 'data', 'prices.json');
  
  // Ensure data directory exists
  const dataDir = path.dirname(outputPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const output = {
    opportunities: updatedCards,
    lastUpdated: new Date().toISOString(),
    stats: {
      totalCards: updatedCards.length,
      viableOpportunities: updatedCards.filter(c => c.isViable).length,
      avgMargin: Math.round(
        updatedCards.reduce((sum, c) => sum + c.marginPercent, 0) / 
        updatedCards.length * 10
      ) / 10,
      successCount,
      failCount,
    },
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  
  console.log('\n' + '='.repeat(50));
  console.log('Update complete!');
  console.log('='.repeat(50));
  console.log(`Success: ${successCount}/${baseCardsData.length}`);
  console.log(`Failed: ${failCount}/${baseCardsData.length}`);
  console.log(`Viable opportunities: ${output.stats.viableOpportunities}`);
  console.log(`Avg margin: ${output.stats.avgMargin}%`);
  console.log(`\nData saved to: ${outputPath}`);
}

updatePrices().catch(console.error);
