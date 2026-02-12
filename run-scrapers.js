#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { scrapeM3ARCards } = require('./dist/lib/scrapers.js');
const { cardStorage } = require('./dist/lib/storage.js');

async function main() {
  console.log('🚀 Starting M3 AR cards scraping...');
  
  try {
    const results = await scrapeM3ARCards();
    const allCards = results.flatMap(r => r.cards);
    
    console.log(`✅ Scraped ${allCards.length} cards from ${results.length} sources`);
    
    // Save data
    await cardStorage.saveCurrentCards(allCards);
    await cardStorage.updatePriceHistory(allCards);
    
    console.log('💾 Data saved successfully!');
    
    // Generate summary
    const summary = {
      totalCards: allCards.length,
      inStockCount: allCards.filter(c => c.availability === 'in_stock').length,
      outOfStockCount: allCards.filter(c => c.availability === 'out_of_stock').length,
      avgPrice: Math.round(allCards.reduce((sum, c) => sum + c.price, 0) / allCards.length),
      lastUpdated: new Date().toISOString()
    };
    
    console.log('\n📊 Summary:');
    console.log(`   Total: ${summary.totalCards} cards`);
    console.log(`   In Stock: ${summary.inStockCount}`);
    console.log(`   Out of Stock: ${summary.outOfStockCount}`);
    console.log(`   Average Price: ￥${summary.avgPrice}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();