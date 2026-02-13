const fs = require('fs');
const path = require('path');

const API_BASE = 'https://www.pokemonpricetracker.com/api/v2';
const API_KEY = process.env.POKEPRICE_API_KEY || 'pokeprice_free_67abf1594acce302cdbaaf1339c9234cbc402f5726e95cd7';

async function fetchM2a() {
  console.log('Fetching all M2a cards from API...\n');
  
  const url = `${API_BASE}/cards?set=m2a&language=japanese`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  
  if (!res.ok) {
    console.log('Error:', res.status);
    return;
  }
  
  const data = await res.json();
  console.log(`Found ${data.data.length} cards\n`);
  
  // Group by rarity
  const byRarity = {};
  data.data.forEach(c => {
    const r = c.rarity || 'Unknown';
    if (!byRarity[r]) byRarity[r] = [];
    byRarity[r].push(c);
  });
  
  console.log('By Rarity:');
  for (const [rarity, cards] of Object.entries(byRarity)) {
    console.log(`  ${rarity}: ${cards.length} cards`);
  }
  
  // Show AR/SR/SAR breakdown
  console.log('\nAR Cards (sample):');
  byRarity['AR']?.slice(0, 5).forEach(c => {
    console.log(`  ${c.cardNumber} - ${c.name}`);
  });
  
  console.log('\nSR Cards (sample):');
  byRarity['SR']?.slice(0, 5).forEach(c => {
    console.log(`  ${c.cardNumber} - ${c.name}`);
  });
  
  console.log('\nSAR Cards (sample):');
  byRarity['SAR']?.slice(0, 5).forEach(c => {
    console.log(`  ${c.cardNumber} - ${c.name}`);
  });
  
  // Save for later use
  fs.writeFileSync('data/m2a-api-cards.json', JSON.stringify(data.data, null, 2));
  console.log('\n✓ Saved to data/m2a-api-cards.json');
}

fetchM2a();
