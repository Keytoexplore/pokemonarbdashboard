const fetch = require('node-fetch');

async function test() {
  const url = 'https://torecacamp-pokemon.com/products/rc_itlo2k7knqnk_ysla';
  
  console.log('Fetching:', url);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  });
  
  const html = await res.text();
  
  // Look for variant data
  console.log('\n=== Looking for variant data ===\n');
  
  // Pattern 1: Look for variant JSON
  const variantMatches = [...html.matchAll(/"id":(\d+)[^}]*"title":"([^"]*A[^"]*)"[^}]*"price":(\d+)[^}]*"inventory_quantity":(\d+)/g)];
  
  console.log(`Found ${variantMatches.length} variant matches`);
  
  for (const match of variantMatches) {
    console.log(`\nVariant ID: ${match[1]}`);
    console.log(`Title: ${match[2]}`);
    console.log(`Price: ¥${match[3]}`);
    console.log(`Stock: ${match[4]}`);
  }
  
  // Pattern 2: Look for simple variant structure
  console.log('\n=== Alternative patterns ===');
  const simpleMatch = html.match(/variants":\s*(\[[^\]]+\])/);
  if (simpleMatch) {
    console.log('Found variants array:', simpleMatch[1].substring(0, 500));
  }
  
  // Pattern 3: Look for data in script tags
  const scriptMatch = html.match(/window\.ShopifyAnalytics[\s\S]*?variants[\s\S]*?(\[.*?\])/);
  if (scriptMatch) {
    console.log('\nFound in ShopifyAnalytics');
  }
}

test();
