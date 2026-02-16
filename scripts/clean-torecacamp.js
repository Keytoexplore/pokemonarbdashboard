#!/usr/bin/env node
/**
 * Clean TorecaCamp data:
 * 1. Remove PSA10/graded card entries
 * 2. Fix stock statuses using add-to-cart button check
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const JPY_TO_USD = 0.0065;
const DELAY_MS = 800;

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkStock(url) {
  try {
    const res = await fetch(url.split('?')[0], {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      }
    });
    const html = await res.text();
    
    // Check if PSA10
    const isPSA10 = html.includes('PSA10') || html.includes('PSA 10');
    
    // Check add-to-cart button
    const addToCartButton = html.match(/<button[^>]*type="submit"[^>]*data-action="add-to-cart"[^>]*>/);
    const inStock = addToCartButton ? !addToCartButton[0].includes('disabled') : false;
    
    return { isPSA10, inStock };
  } catch (e) {
    return { isPSA10: false, inStock: false };
  }
}

async function main() {
  console.log('🧹 Cleaning TorecaCamp data...\n');
  
  const pricesPath = path.join(__dirname, '..', 'data', 'prices.json');
  const data = JSON.parse(fs.readFileSync(pricesPath, 'utf-8'));
  
  let psa10Removed = 0;
  let stockFixed = 0;
  
  for (const card of data.opportunities) {
    // Filter out PSA10 entries
    const originalLength = card.japanesePrices.length;
    card.japanesePrices = card.japanesePrices.filter(p => {
      if (p.source === 'torecacamp' && (p.name?.includes('PSA10') || p.name?.includes('PSA 10'))) {
        console.log(`🗑️ Removing PSA10: ${card.name} - ${p.name}`);
        psa10Removed++;
        return false;
      }
      return true;
    });
    
    // Check remaining TorecaCamp entries
    for (const price of card.japanesePrices) {
      if (price.source !== 'torecacamp') continue;
      
      await delay(DELAY_MS);
      
      const { isPSA10, inStock } = await checkStock(price.url);
      
      if (isPSA10) {
        console.log(`🗑️ Removing PSA10 (detected on check): ${card.name}`);
        psa10Removed++;
        // Mark for removal
        price._remove = true;
        continue;
      }
      
      if (inStock !== price.inStock) {
        console.log(`💰 ${card.name}: ${price.quality} stock ${price.inStock} → ${inStock}`);
        price.inStock = inStock;
        stockFixed++;
      }
    }
    
    // Remove marked entries
    card.japanesePrices = card.japanesePrices.filter(p => !p._remove);
  }
  
  // Recalculate lowest prices and arbitrage for affected cards
  for (const card of data.opportunities) {
    const tcEntry = card.japanesePrices.find(p => p.source === 'torecacamp');
    const jtEntry = card.japanesePrices.find(p => p.source === 'japan-toreca');
    
    const allPrices = [tcEntry, jtEntry].filter(p => p && p.inStock);
    
    if (allPrices.length > 0) {
      const lowest = allPrices.reduce((min, p) => p.priceUSD < min.priceUSD ? p : min);
      card.lowestJapanesePrice = lowest.priceUSD;
      
      card.japanesePrices.forEach(p => {
        p.isLowest = p.inStock && p.priceUSD === card.lowestJapanesePrice;
      });
      
      // Recalculate arbitrage
      if (card.usPrice) {
        const profit = card.usPrice.marketPrice - lowest.priceUSD;
        card.marginPercent = Math.round((profit / lowest.priceUSD) * 100);
        card.marginAmount = Math.round(profit * 100) / 100;
        card.isViable = card.marginPercent > 20;
        
        if (!card.arbitrageUS) card.arbitrageUS = {};
        card.arbitrageUS.profitAmount = card.marginAmount;
        card.arbitrageUS.profitPercent = card.marginPercent;
        card.arbitrageUS.isViable = card.isViable;
        card.arbitrageUS.japanPriceUSD = lowest.priceUSD;
        card.arbitrageUS.usMarketPrice = card.usPrice.marketPrice;
      }
    }
  }
  
  // Update stats
  data.stats.viableOpportunities = data.opportunities.filter(c => c.isViable).length;
  data.lastUpdated = new Date().toISOString();
  
  fs.writeFileSync(pricesPath, JSON.stringify(data, null, 2));
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Cleanup Complete!');
  console.log('='.repeat(50));
  console.log(`PSA10 entries removed: ${psa10Removed}`);
  console.log(`Stock statuses fixed: ${stockFixed}`);
  console.log(`Viable opportunities: ${data.stats.viableOpportunities}`);
}

main().catch(console.error);
