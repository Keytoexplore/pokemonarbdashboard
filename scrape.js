#!/usr/bin/env node

import { generateDashboardData, getDashboardSummary } from './src/lib/dashboard-data.js';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('  M3 AR Cards Dashboard - Data Collection');
  console.log('='.repeat(70) + '\n');
  
  try {
    // Generate dashboard data
    const cards = await generateDashboardData();
    
    // Get summary
    const summary = await getDashboardSummary();
    
    // Save to public directory for Next.js
    const publicDir = path.join(__dirname, 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    const outputFile = path.join(publicDir, 'dashboard-data.json');
    fs.writeFileSync(outputFile, JSON.stringify({
      summary,
      cards
    }, null, 2));
    
    console.log('\n' + '='.repeat(70));
    console.log('  Summary');
    console.log('='.repeat(70));
    console.log(`\n📊 Total Cards: ${summary.totalCards}`);
    console.log(`💰 Average Price: ¥${summary.avgPrice}`);
    console.log(`✅ In Stock: ${summary.inStockCount}`);
    console.log(`❌ Out of Stock: ${summary.outOfStockCount}`);
    console.log(`\n💴 Price Distribution:`);
    console.log(`   Under ¥300: ${summary.priceRanges.under300}`);
    console.log(`   ¥300-500: ${summary.priceRanges['300to500']}`);
    console.log(`   ¥500-1000: ${summary.priceRanges['500to1000']}`);
    console.log(`   Over ¥1000: ${summary.priceRanges.over1000}`);
    
    console.log('\n' + '='.repeat(70));
    console.log('  Sample Cards');
    console.log('='.repeat(70));
    
    // Show top 5 cards by price
    const topCards = [...cards].sort((a, b) => b.lowestPrice - a.lowestPrice).slice(0, 5);
    
    console.log('\n🔝 Top 5 Most Expensive:\n');
    topCards.forEach((card, idx) => {
      console.log(`${idx + 1}. ${card.name} (${card.cardNumber})`);
      console.log(`   Lowest: ¥${card.lowestPrice} (${card.lowestPriceQuality} @ ${card.lowestPriceSource})`);
      
      if (card.prices.qualityA) {
        console.log(`   Quality A: ¥${card.prices.qualityA.price} - ${card.prices.qualityA.availability}`);
      }
      if (card.prices.qualityAMinus) {
        console.log(`   Quality A-: ¥${card.prices.qualityAMinus.price} - ${card.prices.qualityAMinus.availability}`);
      }
      if (card.prices.qualityB) {
        console.log(`   Quality B: ¥${card.prices.qualityB.price} - ${card.prices.qualityB.availability}`);
      }
      console.log('');
    });
    
    console.log('='.repeat(70));
    console.log(`✅ Data saved to: ${outputFile}`);
    console.log(`🕐 Last updated: ${summary.lastUpdated}`);
    console.log('='.repeat(70) + '\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
