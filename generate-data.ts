#!/usr/bin/env tsx
import { calculateArbitrage } from './src/lib/arbitrage';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('🚀 Starting data generation...\n');
  
  try {
    const dashboardData = await calculateArbitrage();
    
    // Ensure data directory exists
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Save data
    const outputPath = path.join(dataDir, 'arbitrage-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(dashboardData, null, 2));
    
    console.log('\n✅ Data saved to:', outputPath);
    console.log('\n📊 Summary:');
    console.log(`  - Total opportunities: ${dashboardData.stats.totalCards}`);
    console.log(`  - Viable opportunities: ${dashboardData.stats.viableOpportunities}`);
    console.log(`  - Average margin: ${dashboardData.stats.avgMargin}%`);
    
    // Show top 5 opportunities
    console.log('\n🏆 Top 5 Opportunities:');
    dashboardData.opportunities.slice(0, 5).forEach((opp, i) => {
      console.log(`  ${i + 1}. ${opp.name} (${opp.cardNumber}) - ${opp.marginPercent}% margin`);
    });
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
