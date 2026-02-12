#!/usr/bin/env tsx
import { getCardMapping } from './src/lib/card-mappings';
import { getTCGPlayerPrice } from './src/lib/tcgplayer-api';

async function testMapping() {
  console.log('Testing card mapping and API integration...\n');
  
  // Test a few card lookups
  const testCards = [
    { cardNumber: '092/080', set: 'M3' },
    { cardNumber: '098/080', set: 'M3' },
    { cardNumber: '108/080', set: 'M3' },
  ];
  
  for (const card of testCards) {
    console.log(`\nTesting ${card.cardNumber} from ${card.set}:`);
    
    const mapping = getCardMapping(card.cardNumber, card.set);
    if (mapping) {
      console.log(`  Japanese: ${mapping.japaneseName}`);
      console.log(`  English: ${mapping.englishName}`);
      console.log(`  Rarity: ${mapping.rarity}`);
      
      // Try to get TCGPlayer price
      const price = await getTCGPlayerPrice(mapping.englishName, card.cardNumber, mapping.rarity);
      if (price) {
        console.log(`  TCGPlayer Price: $${price.marketPrice} (${price.sellerCount} sellers)`);
      } else {
        console.log(`  ⚠️ No TCGPlayer price found`);
      }
    } else {
      console.log(`  ⚠️ No mapping found`);
    }
  }
}

testMapping();