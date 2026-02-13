// Test script for the PokemonPriceTracker integration
// Run with: npx ts-node scripts/test-api.ts

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface TestCard {
  id: string;
  set: string;
  number: string;
  name: string;
}

const testCards: TestCard[] = [
  { id: 'M3-082-SR', set: 'M3', number: '082', name: 'Lugia VSTAR SR' },
  { id: 'M3-093-SAR', set: 'M3', number: '093', name: 'Lugia VSTAR SAR' },
  { id: 'M3-086-AR', set: 'M3', number: '086', name: 'Lugia AR' },
  { id: 'SV1S-001', set: 'SV1S', number: '001', name: 'Sprigatito' },
];

async function testSingleCard(card: TestCard) {
  console.log(`\n--- Testing ${card.name} (${card.set} ${card.number}) ---`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/prices?set=${card.set}&number=${card.number}`);
    
    console.log('Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        const cardData = data.data[0];
        console.log('✓ Card found!');
        console.log('  Name:', cardData.name);
        console.log('  Set:', cardData.setName);
        console.log('  Number:', cardData.cardNumber);
        console.log('  Rarity:', cardData.rarity);
        console.log('  Market Price: $', cardData.prices?.market || 'N/A');
        console.log('  Sellers:', cardData.prices?.sellers || 0);
        console.log('  TCGPlayer URL:', cardData.tcgPlayerUrl);
      } else {
        console.log('✗ No cards found in response');
        console.log('  Response:', JSON.stringify(data, null, 2));
      }
    } else {
      const error = await response.json();
      console.log('✗ Error:', error.error || response.statusText);
    }
  } catch (error) {
    console.log('✗ Fetch error:', error instanceof Error ? error.message : error);
  }
}

async function testBatch() {
  console.log('\n========== BATCH TEST ==========');
  
  try {
    const response = await fetch(`${BASE_URL}/api/prices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cards: testCards.map(c => ({
          id: c.id,
          set: c.set,
          number: c.number,
        })),
      }),
    });
    
    console.log('Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Success:', data.success);
      console.log('Results count:', Object.keys(data.results || {}).length);
      console.log('Errors:', data.errors || 'None');
      
      if (data.results) {
        for (const [id, result] of Object.entries(data.results)) {
          const cardData = (result as any).data?.[0];
          if (cardData) {
            console.log(`  ✓ ${id}: $${cardData.prices?.market || 'N/A'}`);
          }
        }
      }
    } else {
      const error = await response.json();
      console.log('✗ Error:', error);
    }
  } catch (error) {
    console.log('✗ Fetch error:', error instanceof Error ? error.message : error);
  }
}

async function main() {
  console.log('PokemonPriceTracker API Test');
  console.log('============================');
  console.log('Base URL:', BASE_URL);
  
  // Test individual cards
  for (const card of testCards) {
    await testSingleCard(card);
    // Small delay between tests
    await new Promise(r => setTimeout(r, 500));
  }
  
  // Test batch endpoint
  await testBatch();
  
  console.log('\n========== TEST COMPLETE ==========');
}

main();
