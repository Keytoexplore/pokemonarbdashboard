#!/usr/bin/env node
/**
 * Check actual stock status on TorecaCamp page
 */

const fetch = require('node-fetch');

async function checkStock(url, name) {
  console.log(`\n=== ${name} ===`);
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    }
  });
  const html = await res.text();
  
  // Look for variant data with more detail
  const variantDataMatch = html.match(/variants":\s*(\[[\s\S]*?\])[,;]/);
  if (variantDataMatch) {
    try {
      const variants = JSON.parse(variantDataMatch[1]);
      console.log('Variants found:', variants.length);
      
      variants.forEach(v => {
        const title = v.public_title || v.title;
        const price = Math.round(v.price / 100);
        console.log(`\n  ${title}:`);
        console.log(`    Price: ¥${price}`);
        console.log(`    available: ${v.available}`);
        console.log(`    inventory_quantity: ${v.inventory_quantity}`);
        console.log(`    id: ${v.id}`);
      });
    } catch (e) {
      console.log('Error parsing variants:', e.message);
    }
  }
  
  // Look for the actual add to cart button state
  console.log('\n\nChecking for add to cart button...');
  
  // Find button with name="add"
  const buttonMatch = html.match(/<button[^>]*name="add"[^>]*>([\s\S]*?)<\/button>/);
  if (buttonMatch) {
    console.log('Add to cart button HTML:', buttonMatch[0].substring(0, 200));
    console.log('Button disabled?', buttonMatch[0].includes('disabled'));
  } else {
    console.log('No add to cart button found');
  }
  
  // Look for variant selector
  console.log('\n\nVariant selector:');
  const selectorMatch = html.match(/<select[^>]*name="id"[^>]*>([\s\S]*?)<\/select>/);
  if (selectorMatch) {
    const options = selectorMatch[1].match(/<option[^>]*>(.*?)<\/option>/g);
    if (options) {
      options.forEach(opt => {
        console.log('  ', opt.replace(/<[^>]*>/g, '').trim());
      });
    }
  }
}

async function main() {
  await checkStock(
    'https://torecacamp-pokemon.com/products/rc_it3i3r1n4hnp_6xme',
    'Serperior ex - 167/086'
  );
}

main().catch(console.error);
