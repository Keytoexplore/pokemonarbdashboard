#!/usr/bin/env node
/**
 * Check product form for stock status
 */

const fetch = require('node-fetch');

async function checkForm(url, name) {
  console.log(`\n=== ${name} ===`);
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    }
  });
  const html = await res.text();
  
  // Find the product form
  const formMatch = html.match(/<form[^>]*id="product_form[^"]*"[^>]*>([\s\S]*?)<\/form>/);
  if (!formMatch) {
    console.log('Product form not found');
    return;
  }
  
  const form = formMatch[0];
  console.log('Found product form\n');
  
  // Check for submit button
  const submitMatch = form.match(/<button[^>]*type="submit"[^>]*>([\s\S]*?)<\/button>/);
  if (submitMatch) {
    console.log('Submit button found:');
    console.log('  HTML:', submitMatch[0].substring(0, 200));
    console.log('  Disabled:', submitMatch[0].includes('disabled'));
    console.log('  Text:', submitMatch[1].replace(/<[^>]*>/g, '').trim());
  } else {
    console.log('No submit button found');
  }
  
  // Check for data-attributes on form
  console.log('\nForm data attributes:');
  const dataMatch = form.match(/data-[^=]*="[^"]*"/g);
  if (dataMatch) {
    dataMatch.forEach(attr => {
      if (attr.includes('available') || attr.includes('inventory') || attr.includes('stock')) {
        console.log(' ', attr);
      }
    });
  }
  
  // Check for variant availability in JavaScript
  console.log('\n\nChecking for product JSON data...');
  const jsonMatch = html.match(/product":\s*({[\s\S]*?}),\s*"/);
  if (jsonMatch) {
    try {
      const product = JSON.parse(jsonMatch[1]);
      console.log('Product found:', product.title);
      if (product.variants) {
        console.log('Variants:', product.variants.length);
        product.variants.forEach(v => {
          console.log(`  ${v.title || v.public_title}: available=${v.available}, qty=${v.inventory_quantity}`);
        });
      }
    } catch (e) {
      console.log('Could not parse product JSON');
    }
  }
}

async function main() {
  await checkForm(
    'https://torecacamp-pokemon.com/products/rc_it3i3r1n4hnp_6xme',
    'Serperior ex - 167/086'
  );
}

main().catch(console.error);
