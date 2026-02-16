#!/usr/bin/env node
/**
 * Debug specific TorecaCamp cards
 */

const fetch = require('node-fetch');

const JPY_TO_USD = 0.0065;

async function debugCard(url, name) {
  console.log(`\n=== ${name} ===`);
  console.log('URL:', url);
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    }
  });
  const html = await res.text();
  
  // Extract variants
  const variantsMatch = html.match(/variants":\s*(\[.*?\])[,;]/);
  if (!variantsMatch) {
    console.log('No variants found');
    return;
  }
  
  const variants = JSON.parse(variantsMatch[1]);
  
  // Check for sold out indicators
  const hasSoldOutText = html.includes('売り切れ') || html.includes('売切れ') || html.includes('在庫なし');
  
  console.log('Has sold out text:', hasSoldOutText);
  console.log('\nVariants:');
  
  variants.forEach(v => {
    const title = v.public_title || v.title;
    const price = Math.round(v.price / 100);
    const quality = title.match(/([AB\-]+)/)?.[1] || '?';
    
    // Stock detection logic from scraper
    let inStock = v.available !== false && v.available !== 'false';
    if (v.inventory_quantity !== undefined) {
      inStock = inStock && v.inventory_quantity > 0;
    }
    if (hasSoldOutText) {
      inStock = false;
    }
    
    console.log(`  ${title}:`);
    console.log(`    Price: ¥${price}`);
    console.log(`    Quality: ${quality}`);
    console.log(`    available: ${v.available}`);
    console.log(`    inventory_quantity: ${v.inventory_quantity}`);
    console.log(`    inStock (calculated): ${inStock}`);
  });
}

async function main() {
  // Serperior ex - 167/086
  await debugCard(
    'https://torecacamp-pokemon.com/products/rc_it3i3r1n4hnp_6xme',
    'Serperior ex - 167/086'
  );
  
  // Genesect ex - 172/086
  await debugCard(
    'https://torecacamp-pokemon.com/products/rc_itcjumsk4p5n_i75o',
    'Genesect ex - 172/086'
  );
}

main().catch(console.error);
