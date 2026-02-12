#!/usr/bin/env tsx
import { getCardMapping, getAllMappingsForSet } from './src/lib/card-mappings';
import { getTCGPlayerPrice } from './src/lib/tcgplayer-api';

async function testMappingIntegration() {
  console.log('='.repeat(80));
  console.log('TESTING JAPANESE → ENGLISH CARD MAPPING & TCGPLAYER API INTEGRATION');
  console.log('='.repeat(80));
  console.log();
  
  // Get all M3 mappings
  const allM3Cards = getAllMappingsForSet('M3');
  console.log(`📊 Total M3 cards mapped: ${allM3Cards.length}`);
  console.log();
  
  // Test a sample of cards from different categories
  const testCards = [
    // Regular V/VSTAR cards
    '079/098', // Lugia V (regular)
    '080/098', // Lugia VSTAR (regular)
    '036/098', // Unown VSTAR
    '058/098', // Regieleki VMAX (wrong number, should be 034/098)
    '034/098', // Regieleki VMAX (correct)
    
    // Full Art V cards
    '109/098', // Lugia V Full Art
    '110/098', // Lugia V Alt Art (EXPENSIVE!)
    '103/098', // Unown V Alt Art
    
    // Full Art Trainers
    '113/098', // Candice Full Art
    '114/098', // Lance Full Art
    '111/098', // Worker Full Art
    
    // Rainbow Rares
    '116/098', // Unown VSTAR Rainbow
    '117/098', // Regidrago VSTAR Rainbow
    '118/098', // Lugia VSTAR Rainbow
    
    // Hyper Rares
    '119/098', // Worker Hyper Rare
    '121/098', // Candice Hyper Rare
    
    // Gold Cards
    '123/098', // Lugia VSTAR Gold
    
    // Japanese Exclusive AR
    '087/080', // Gardevoir AR (exists in English but not as AR)
    '088/080', // Eevee AR (Japanese exclusive)
  ];
  
  console.log('🔍 Testing card mappings and price lookups:\n');
  
  let successCount = 0;
  let failureCount = 0;
  let japaneseExclusiveCount = 0;
  
  for (const japaneseCardNumber of testCards) {
    const mapping = getCardMapping(japaneseCardNumber, 'M3');
    
    if (!mapping) {
      console.log(`❌ No mapping found for Japanese card ${japaneseCardNumber}`);
      failureCount++;
      continue;
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎴 Japanese: ${mapping.japaneseName} #${mapping.japaneseCardNumber}`);
    console.log(`   English:  ${mapping.englishName} #${mapping.englishCardNumber}`);
    console.log(`   Rarity:   ${mapping.rarity}`);
    if (mapping.notes) {
      console.log(`   Notes:    ${mapping.notes}`);
    }
    
    if (mapping.englishCardNumber === 'N/A') {
      console.log(`   ⚠️  Japanese exclusive - no English version`);
      japaneseExclusiveCount++;
      continue;
    }
    
    // Try to get price from TCGPlayer API
    try {
      const price = await getTCGPlayerPrice(
        mapping.englishName,
        mapping.englishCardNumber,
        mapping.rarity,
        mapping.notes
      );
      
      if (price) {
        console.log(`   💰 Price: $${price.marketPrice.toFixed(2)}`);
        console.log(`   📊 Sellers: ${price.sellerCount} | Listings: ${price.listingCount}`);
        successCount++;
      } else {
        console.log(`   ❌ No price data found`);
        failureCount++;
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`);
      failureCount++;
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Successfully fetched prices: ${successCount}`);
  console.log(`❌ Failed to fetch prices: ${failureCount}`);
  console.log(`⚠️  Japanese exclusives: ${japaneseExclusiveCount}`);
  console.log(`📊 Total cards tested: ${testCards.length}`);
  console.log(`📚 Total cards mapped: ${allM3Cards.length}`);
  console.log();
  
  // Show some statistics
  const byRarity = allM3Cards.reduce((acc, card) => {
    acc[card.rarity] = (acc[card.rarity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('Card distribution by rarity:');
  Object.entries(byRarity).forEach(([rarity, count]) => {
    console.log(`  ${rarity}: ${count} cards`);
  });
  
  const japaneseExclusives = allM3Cards.filter(c => c.englishCardNumber === 'N/A');
  console.log(`\nJapanese exclusives: ${japaneseExclusives.length} cards`);
  japaneseExclusives.forEach(card => {
    console.log(`  - ${card.japaneseName} (${card.englishName}) #${card.japaneseCardNumber}`);
  });
}

testMappingIntegration().catch(console.error);
