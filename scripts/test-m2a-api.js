const API_BASE = 'https://www.pokemonpricetracker.com/api/v2';
const API_KEY = process.env.POKEPRICE_API_KEY || 'pokeprice_free_67abf1594acce302cdbaaf1339c9234cbc402f5726e95cd7';

async function testM2a() {
  console.log('Testing M2a API availability...\n');
  
  const url = `${API_BASE}/cards?set=mega-dream-ex&language=japanese`;
  console.log('Fetching:', url);
  
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    console.log('Status:', res.status);
    
    if (res.ok) {
      const data = await res.json();
      console.log('\n✓ API working!');
      console.log('Cards found:', data.data?.length || 0);
      
      if (data.data && data.data.length > 0) {
        console.log('\nSample cards:');
        data.data.slice(0, 5).forEach(c => {
          console.log(`  ${c.cardNumber} - ${c.name} (${c.rarity})`);
        });
      }
    } else {
      console.log('\n✗ API error:', await res.text());
    }
  } catch (e) {
    console.log('\n✗ Error:', e.message);
  }
}

testM2a();
