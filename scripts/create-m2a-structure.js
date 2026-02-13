#!/usr/bin/env node
/**
 * Create M2a card structure from API data
 * Usage: node scripts/create-m2a-structure.js
 */

const fs = require('fs');
const path = require('path');

const JPY_TO_USD = 0.0065;

// Load M2a cards from API
const m2aCards = JSON.parse(fs.readFileSync('data/m2a-api-cards.json', 'utf-8'));

// Load existing prices
const pricesPath = path.join(__dirname, '..', 'data', 'prices.json');
const data = JSON.parse(fs.readFileSync(pricesPath, 'utf-8'));

// Filter for AR, SR, SAR only
const targetCards = m2aCards.filter(c => 
  ['Art Rare', 'Super Rare', 'Special Art Rare'].includes(c.rarity)
);

console.log(`Creating structure for ${targetCards.length} M2a cards\n`);

const newCards = targetCards.map(card => {
  const rarity = card.rarity === 'Art Rare' ? 'AR' : 
                 card.rarity === 'Super Rare' ? 'SR' : 'SAR';
  
  // Create search URLs (for manual scraping later)
  const searchName = card.name.replace(/'/g, '').replace(/\s+/g, ' ').trim();
  
  return {
    id: `M2a-${card.cardNumber.replace('/', '-')}-${rarity}`,
    name: card.name,
    cardNumber: card.cardNumber,
    rarity,
    set: 'M2a',
    japanesePrices: [], // Will be populated by scraper
    lowestJapanesePrice: 0,
    usPrice: {
      marketPrice: card.prices?.market || 0,
      sellerCount: card.prices?.sellers || 0,
      listingCount: card.prices?.listings || 0,
      currency: 'USD',
      imageUrl: card.imageUrl,
      imageCdnUrl: card.imageCdnUrl,
      cardName: card.name,
      tcgPlayerUrl: card.tcgPlayerUrl
    },
    arbitrageUS: null,
    marginPercent: 0,
    marginAmount: 0,
    lastUpdated: new Date().toISOString(),
    isViable: false,
    _searchUrls: {
      japanToreca: `https://shop.japan-toreca.com/search?q=m2a+${encodeURIComponent(searchName)}`,
      torecaCamp: `https://torecacamp-pokemon.com/search?q=${encodeURIComponent(searchName)}+m2a`
    }
  };
});

// Merge with existing M3 cards
data.opportunities = [...data.opportunities, ...newCards];

// Update stats
data.stats.totalCards = data.opportunities.length;
data.lastUpdated = new Date().toISOString();

// Save
fs.writeFileSync(pricesPath, JSON.stringify(data, null, 2));

console.log('✅ Added M2a cards to prices.json');
console.log(`Total cards: ${data.stats.totalCards} (${data.opportunities.filter(c => c.set === 'M3').length} M3 + ${newCards.length} M2a)`);

// Create search helper file
const searchHelper = newCards.map(c => ({
  name: c.name,
  cardNumber: c.cardNumber,
  rarity: c.rarity,
  japanToreca: c._searchUrls.japanToreca,
  torecaCamp: c._searchUrls.torecaCamp
}));

fs.writeFileSync('data/m2a-search-helper.json', JSON.stringify(searchHelper, null, 2));
console.log('\n✓ Created data/m2a-search-helper.json with search URLs');
console.log('\nNext steps:');
console.log('1. Visit search URLs to find product pages');
console.log('2. Update prices.json with Japanese prices');
console.log('3. Run: node scripts/scrape-torecacamp.js');
