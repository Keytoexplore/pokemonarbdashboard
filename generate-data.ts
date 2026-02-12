#!/usr/bin/env tsx
import { generateAndSaveData, CONFIG } from './src/lib/arbitrage';

async function main() {
  console.log('🚀 Pokemon Arbitrage Data Generator\n');
  console.log(`📦 Configured sets: ${CONFIG.sets.join(', ')}`);
  console.log(`⏰ Cache TTL: 3 days\n`);
  
  try {
    await generateAndSaveData();
    console.log('\n✅ Data generation complete!');
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();