const fetch = require('node-fetch');

async function check() {
  const url = 'https://shop.japan-toreca.com/products/pokemon-227740-a-damaged';
  const res = await fetch(url, {
    headers: {'User-Agent': 'Mozilla/5.0'}
  });
  const html = await res.text();
  
  console.log('Title:', html.match(/<title>(.*?)<\/title>/)?.[1]);
  console.log('\nPrice patterns:');
  
  // Check various patterns
  const patterns = [
    /<span[^>]*class="[^"]*product-price[^"]*"[^>]*>\s*¥\s*([\d,]+)/i,
    /<span[^>]*class="[^"]*money[^"]*"[^>]*>\s*¥\s*([\d,]+)/i,
    /<span[^>]*class="[^"]*price[^"]*"[^>]*>\s*¥\s*([\d,]+)/i,
    /"price":\s*(\d+)/,
    /¥\s*([\d,]+)/,
  ];
  
  for (const p of patterns) {
    const m = html.match(p);
    if (m) console.log('Match:', p.toString().substring(0,60), '=>', m[1]);
  }
  
  // First 5 yen amounts
  const allYen = [...html.matchAll(/¥\s*([\d,]+)/g)].map(m => m[1]).slice(0,5);
  console.log('\nFirst ¥ amounts:', allYen);
}

check();
