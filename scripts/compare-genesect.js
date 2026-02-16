#!/usr/bin/env node
/**
 * Compare both Genesect products
 */

const fetch = require('node-fetch');

async function checkProduct(url, label) {
  console.log(`\n=== ${label} ===`);
  console.log('URL:', url);
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    }
  });
  const html = await res.text();
  
  // Title
  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  console.log('Title:', titleMatch ? titleMatch[1] : 'Not found');
  
  // Check for PSA10
  const isPSA10 = html.includes('PSA10') || html.includes('PSA 10');
  console.log('Is PSA10:', isPSA10);
  
  // Variants
  const variantsMatch = html.match(/variants":\s*(\[.*?\])[,;]/);
  if (variantsMatch) {
    const variants = JSON.parse(variantsMatch[1]);
    console.log('Variants:');
    variants.forEach(v => {
      const title = v.public_title || v.title;
      const price = Math.round(v.price / 100);
      console.log(`  ${title}: ¥${price}`);
    });
  }
}

async function main() {
  await checkProduct('https://torecacamp-pokemon.com/products/rc_itnkxzunlkbs_ux3h', 'Product 1');
  await checkProduct('https://torecacamp-pokemon.com/products/rc_itcjumsk4p5n_i75o', 'Product 2 (current in DB)');
}

main().catch(console.error);
