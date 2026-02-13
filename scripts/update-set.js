/**
 * Update prices by fetching all cards from API and filtering locally
 * Works around the broken number filter on PokemonPriceTracker API
 * Usage: node scripts/update-set.js SV10
 */

const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'https://www.pokemonpricetracker.com/api/v2';
const API_KEY = process.env.POKEPRICE_API_KEY || 'pokeprice_free_67abf1594acce302cdbaaf1339c9234cbc402f5726e95cd7';

const setCode = process.argv[2];

if (!setCode) {
  console.error('Usage: node scripts/update-set.js <SET_CODE>');
  console.error('Example: node scripts/update-set.js SV10');
  process.exit(1);
}

const apiSetId = setCode.toLowerCase();

async function fetchAllCardsForSet() {
  console.log(`Fetching all cards for ${setCode}...\n`);
  
  const url = `${API_BASE_URL}/cards?set=${apiSetId}&language=japanese`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      console.log('No cards found for this set.');
      return [];
    }
    
    console.log(`Found ${data.data.length} cards in API\n`);
    
    // Create a map of card number to card data
    const cardMap = new Map();
    
    data.data.forEach(card => {
      // Extract just the number part (e.g., "132/098" -> "132")
      const numMatch = card.cardNumber.match(/^(\d+)/);
      if (numMatch) {
        const cardNum = numMatch[1];
        cardMap.set(cardNum, {
          marketPrice: card.prices?.market || 0,
          sellerCount: card.prices?.sellers || 0,
          listingCount: card.prices?.listings || 0,
          currency: 'USD',
          imageUrl: card.imageUrl,
          imageCdnUrl: card.imageCdnUrl,
          cardName: card.name,
          tcgPlayerUrl: card.tcgPlayerUrl,
        });
      }
    });
    
    return cardMap;
  } catch (error) {
    console.error('Error fetching cards:', error.message);
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

async function updateSet() {
  // Load existing data
  const pricesPath = path.join(__dirname, '..', 'data', 'prices.json');
  let existingData = { opportunities: [] };
  
  if (fs.existsSync(pricesPath)) {
    existingData = JSON.parse(fs.readFileSync(pricesPath, 'utf-8'));
  }
  
  // Fetch all US prices for the set
  const usPriceMap = await fetchAllCardsForSet();
  
  if (!usPriceMap) {
    console.error('Failed to fetch US prices');
    process.exit(1);
  }
  
  if (usPriceMap.size === 0) {
    console.log('No US price data available for this set yet.');
    process.exit(0);
  }
  
  // Update existing cards with US prices
  let updatedCount = 0;
  let missingCount = 0;
  
  const updatedOpportunities = existingData.opportunities.map(card => {
    // Only update cards from this set
    if (card.set !== setCode) return card;
    
    const cardNum = card.cardNumber.split('/')[0];
    const usPrice = usPriceMap.get(cardNum);
    
    if (usPrice) {
      updatedCount++;
      const japanPriceUSD = card.lowestJapanesePrice;
      const arbitrage = calculateArbitrage(japanPriceUSD, usPrice.marketPrice);
      
      return {
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
      };
    } else {
      missingCount++;
      return card;
    }
  });
  
  // Save updated data
  const output = {
    opportunities: updatedOpportunities,
    lastUpdated: new Date().toISOString(),
    stats: {
      totalCards: updatedOpportunities.length,
      viableOpportunities: updatedOpportunities.filter(c => c.isViable).length,
      avgMargin: Math.round(updatedOpportunities.reduce((sum, c) => sum + c.marginPercent, 0) / updatedOpportunities.length * 10) / 10,
    },
  };
  
  fs.writeFileSync(pricesPath, JSON.stringify(output, null, 2));
  
  console.log('\n' + '='.repeat(50));
  console.log('Update complete!');
  console.log('='.repeat(50));
  console.log(`Cards updated: ${updatedCount}`);
  console.log(`Cards missing US price: ${missingCount}`);
  console.log(`Viable opportunities: ${output.stats.viableOpportunities}`);
  console.log(`Avg margin: ${output.stats.avgMargin}%`);
}

updateSet().catch(console.error);
