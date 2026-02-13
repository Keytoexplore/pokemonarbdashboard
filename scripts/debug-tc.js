const fetch = require('node-fetch');

async function check() {
  const url = 'https://torecacamp-pokemon.com/products/rc_itpqrm9yul95_4ycx';
  const res = await fetch(url, {
    headers: {'User-Agent': 'Mozilla/5.0'}
  });
  const html = await res.text();
  
  console.log('Title:', html.match(/<title>(.*?)<\/title>/)?.[1]);
  console.log('\nPrice patterns:');
  
  // Check various patterns
  const patterns = [
    /data-price="(\d+)"/,
    /<span class="price[^"]*">\s*¥?([\d,]+)/,
    /<span class="money[^"]*">\s*¥?([\d,]+)/,
    /"price":\s*(\d+)/,
    /"price":\s*"(\d+)"/,
    /<span[^>]*>(\d{3,5})[^<]*<\/span>/g,
  ];
  
  for (const p of patterns) {
    const m = html.match(p);
    if (m) console.log('Match:', p.toString().substring(0,50), '=>', m[1]);
  }
  
  // All yen amounts
  const allYen = [...html.matchAll(/¥?([\d,]{3,5})/g)].map(m => m[1]).slice(0,10);
  console.log('\nAll numbers:', allYen);
}

check();
