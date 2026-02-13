/**
 * Simple price update script (JavaScript)
 * Usage: node scripts/update-prices-simple.js
 */

const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'https://www.pokemonpricetracker.com/api/v2';
const API_KEY = process.env.POKEPRICE_API_KEY || 'pokeprice_free_67abf1594acce302cdbaaf1339c9234cbc402f5726e95cd7';

// Load card data
const cardDataPath = path.join(__dirname, '..', 'lib', 'card-data.ts');
// Extract data from TS file (hacky but works for now)
const cards = require('../data/prices.json').opportunities;

const RATE_LIMIT_MS = 1100;
let lastRequestTime = 0;

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function rateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    await delay(RATE_LIMIT_MS - timeSinceLastRequest);
  }
  lastRequestTime = Date.now();
}

async function fetchCardPrice(setCode, cardNumber) {
  await rateLimit();
  
  // Use 'm3' for M3 set
  const apiSetId = setCode === 'M3' ? 'm3' : setCode.toLowerCase();
  const cardNum = cardNumber.split('/')[0];
  
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
      if (response.status === 404) return null;
      if (response.status === 429) {
        console.log('  Rate limited, waiting 5s...');
        await delay(5000);
        return fetchCardPrice(setCode, cardNumber);
      }
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
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
    console.error(`  Error:`, error.message);
    return null;
  }
}

function calculateArbitrage(japanPriceUSD, usMarketPrice) {
  const profitAmount = usMarketPrice - japanPriceUSD;
  const profitPercent = japanPriceUSD > 0 ? (profitAmount / japanPriceUSD) * 100 : 0;
  return {
    profitAmount: Math.round(profitAmount * 100) / 100,
    profitPercent: Math.round(profitPercent * 10) / 10,
    isViable: profitPercent > 20,
  };
}

async function updatePrices() {
  console.log('Starting M3 price update...\n');
  console.log(`Processing ${cards.length} cards...\n`);
  
  const updatedCards = [];
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    console.log(`[${i + 1}/${cards.length}] ${card.name} (${card.set} ${card.cardNumber})`);
    
    const usPrice = await fetchCardPrice(card.set, card.cardNumber);
    
    if (usPrice) {
      console.log(`  ✓ US Price: $${usPrice.marketPrice} (${usPrice.sellerCount} sellers)`);
      successCount++;
      
      const japanPriceUSD = card.lowestJapanesePrice;
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
      console.log(`  ✗ No US price found`);
      failCount++;
      updatedCards.push(card);
    }
  }
  
  // Sort by profit
  updatedCards.sort((a, b) => (b.marginPercent || 0) - (a.marginPercent || 0));
  
  // Save
  const outputPath = path.join(__dirname, '..', 'data', 'prices.json');
  const output = {
    opportunities: updatedCards,
    lastUpdated: new Date().toISOString(),
    stats: {
      totalCards: updatedCards.length,
      viableOpportunities: updatedCards.filter(c => c.isViable).length,
      avgMargin: Math.round(updatedCards.reduce((sum, c) => sum + c.marginPercent, 0) / updatedCards.length * 10) / 10,
      successCount,
      failCount,
    },
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  
  console.log('\n' + '='.repeat(50));
  console.log('Update complete!');
  console.log('='.repeat(50));
  console.log(`Success: ${successCount}/${cards.length}`);
  console.log(`Failed: ${failCount}/${cards.length}`);
  console.log(`Viable opportunities: ${output.stats.viableOpportunities}`);
  console.log(`Avg margin: ${output.stats.avgMargin}%`);
}

updatePrices().catch(console.error);
