#!/usr/bin/env node
/**
 * Debug specific TorecaCamp cards - check sold out text location
 */

const fetch = require('node-fetch');

async function debugCard(url, name) {
  console.log(`\n=== ${name} ===`);
  console.log('URL:', url);
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    }
  });
  const html = await res.text();
  
  // Find where sold out text appears
  const soldOutPatterns = ['売り切れ', '売切れ', '在庫なし', 'Sold Out', 'sold out'];
  
  console.log('\nSold out text locations:');
  soldOutPatterns.forEach(pattern => {
    const index = html.indexOf(pattern);
    if (index !== -1) {
      // Show context around the match
      const context = html.substring(Math.max(0, index - 100), index + 100);
      console.log(`\n  Pattern: "${pattern}" at position ${index}`);
      console.log(`  Context: ...${context.replace(/\n/g, ' ')}...`);
    }
  });
  
  // Check for add to cart button
  console.log('\n\nAdd to cart button check:');
  if (html.includes('data-add-to-cart-text="カートに追加"')) {
    console.log('  Found: data-add-to-cart-text="カートに追加"');
  }
  if (html.includes('<button[^>]*name="add"')) {
    console.log('  Found: <button name="add"');
  }
  
  // Check for variant-specific stock info in JSON
  const variantsMatch = html.match(/variants":\s*(\[.*?\])[,;]/);
  if (variantsMatch) {
    const variants = JSON.parse(variantsMatch[1]);
    console.log('\n\nVariant inventory details:');
    variants.forEach(v => {
      console.log(`  ${v.public_title || v.title}:`);
      console.log(`    available: ${v.available}`);
      console.log(`    inventory_quantity: ${v.inventory_quantity}`);
      console.log(`    inventory_policy: ${v.inventory_policy}`);
    });
  }
}

async function main() {
  await debugCard(
    'https://torecacamp-pokemon.com/products/rc_it3i3r1n4hnp_6xme',
    'Serperior ex - 167/086'
  );
}

main().catch(console.error);
