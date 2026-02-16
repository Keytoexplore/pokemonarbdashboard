#!/usr/bin/env node
/**
 * Clean contaminated price data caused by cross-set matching bug
 * Removes prices where the card name doesn't match the expected card
 */

const fs = require('fs');
const path = require('path');

const pricesPath = path.join(__dirname, '..', 'data', 'prices.json');
const data = JSON.parse(fs.readFileSync(pricesPath, 'utf-8'));

console.log('='.repeat(60));
console.log('🧹 Cleaning Contaminated Price Data');
console.log('='.repeat(60));

let totalRemoved = 0;
let cardsCleaned = 0;

// Known card name mappings (Japanese name -> Expected card identifiers)
// This helps us detect when a price entry has the wrong card name
function isWrongCard(cardEntry, priceEntry) {
  const cardName = cardEntry.name.toLowerCase();
  const jpPriceName = priceEntry.name?.toLowerCase() || '';
  
  // Check for obvious mismatches based on card names
  // Zekrom ex should not have Keldeo ex prices
  if (cardName.includes('zekrom') && jpPriceName.includes('ケルディオ')) {
    return true;
  }
  if (cardName.includes('keldeo') && jpPriceName.includes('ゼクロム')) {
    return true;
  }
  
  // Add more known mismatches here as we discover them
  
  return false;
}

// Clean each card's japanesePrices
data.opportunities.forEach(card => {
  const originalCount = card.japanesePrices?.length || 0;
  
  if (!card.japanesePrices || card.japanesePrices.length === 0) {
    return;
  }
  
  // Filter out contaminated prices
  const cleanedPrices = card.japanesePrices.filter(price => {
    if (isWrongCard(card, price)) {
      console.log(`  🗑️ Removing contaminant:`);
      console.log(`     Card: ${card.name} (${card.set} #${card.cardNumber})`);
      console.log(`     Wrong price: ${price.name} ¥${price.priceJPY} from ${price.source}`);
      totalRemoved++;
      return false;
    }
    return true;
  });
  
  if (cleanedPrices.length !== originalCount) {
    cardsCleaned++;
    card.japanesePrices = cleanedPrices;
    
    // Recalculate lowest price
    const inStock = cleanedPrices.filter(p => p.inStock);
    const lowest = inStock.length > 0 
      ? inStock.reduce((m, p) => p.priceUSD < m.priceUSD ? p : m)
      : cleanedPrices[0];
    
    if (lowest) {
      card.lowestJapanesePrice = lowest.priceUSD;
      card.japanesePrices.forEach(p => {
        p.isLowest = p === lowest;
      });
    } else {
      card.lowestJapanesePrice = 0;
    }
    
    // Recalculate arbitrage
    const usPrice = card.usPrice?.marketPrice || 0;
    const japanPrice = card.lowestJapanesePrice || 0;
    
    if (japanPrice > 0 && usPrice > 0) {
      const marginAmount = Math.round((usPrice - japanPrice) * 100) / 100;
      const marginPercent = Math.round((marginAmount / japanPrice) * 100);
      card.marginAmount = marginAmount;
      card.marginPercent = marginPercent;
      card.isViable = marginPercent > 20;
      
      if (card.arbitrageUS) {
        card.arbitrageUS.profitAmount = marginAmount;
        card.arbitrageUS.profitPercent = marginPercent;
        card.arbitrageUS.isViable = card.isViable;
        card.arbitrageUS.japanPriceUSD = japanPrice;
      }
    } else {
      card.marginAmount = 0;
      card.marginPercent = 0;
      card.isViable = false;
      card.arbitrageUS = null;
    }
    
    card.lastUpdated = new Date().toISOString();
  }
});

// Update stats
const viableCount = data.opportunities.filter(c => c.isViable).length;
data.stats.viableOpportunities = viableCount;
data.lastUpdated = new Date().toISOString();

// Save cleaned data
fs.writeFileSync(pricesPath, JSON.stringify(data, null, 2));

console.log('\n' + '='.repeat(60));
console.log('✅ Data Cleaning Complete');
console.log('='.repeat(60));
console.log(`Cards cleaned: ${cardsCleaned}`);
console.log(`Contaminated prices removed: ${totalRemoved}`);
console.log(`Viable opportunities: ${viableCount}`);
console.log('\nNext step: Re-scrape SV11B with fixed scraper');
