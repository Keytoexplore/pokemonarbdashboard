const API_BASE = 'https://www.pokemonpricetracker.com/api/v2';
const API_KEY = process.env.POKEPRICE_API_KEY || 'pokeprice_free_67abf1594acce302cdbaaf1339c9234cbc402f5726e95cd7';

const setIds = ['mega-dream-ex', 'm2a', 'mega-dream', 'm2', 'mega-dream-ex-jp'];

async function testSet(setId) {
  const url = `${API_BASE}/cards?set=${setId}&language=japanese`;
  try {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    if (res.ok) {
      const data = await res.json();
      return { id: setId, count: data.data?.length || 0, status: res.status };
    }
    return { id: setId, count: 0, status: res.status };
  } catch (e) {
    return { id: setId, count: 0, status: 'error' };
  }
}

async function main() {
  console.log('Testing different M2a set IDs...\n');
  for (const setId of setIds) {
    const result = await testSet(setId);
    console.log(`${result.id}: ${result.count} cards (status: ${result.status})`);
    await new Promise(r => setTimeout(r, 500));
  }
}

main();
