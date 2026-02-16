#!/usr/bin/env node
/**
 * Check raw HTML for add to cart elements
 */

const fetch = require('node-fetch');

async function checkHTML(url, name) {
  console.log(`\n=== ${name} ===`);
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    }
  });
  const html = await res.text();
  
  // Look for various add to cart patterns
  console.log('Looking for cart-related elements:\n');
  
  // Pattern 1: data-add-to-cart
  if (html.includes('data-add-to-cart')) {
    console.log('✓ Found: data-add-to-cart');
    const matches = html.match(/data-add-to-cart[^\s>]*/g);
    if (matches) console.log('  ', matches.slice(0, 3));
  }
  
  // Pattern 2: AddToCart
  if (html.includes('AddToCart')) {
    console.log('✓ Found: AddToCart');
  }
  
  // Pattern 3: カートに追加
  if (html.includes('カートに追加')) {
    console.log('✓ Found: カートに追加');
    // Count occurrences
    const count = (html.match(/カートに追加/g) || []).length;
    console.log(`   Count: ${count}`);
  }
  
  // Pattern 4: product-form or product_form
  if (html.includes('product-form') || html.includes('product_form')) {
    console.log('✓ Found: product-form');
  }
  
  // Pattern 5: Look for disabled button
  const disabledMatch = html.match(/<button[^>]*disabled[^>]*>/g);
  if (disabledMatch) {
    console.log('✗ Found disabled buttons:', disabledMatch.length);
    console.log('   ', disabledMatch[0].substring(0, 100));
  }
  
  // Pattern 6: Look for form with add to cart
  const formMatch = html.match(/<form[^>]*>([\s\S]*?)<\/form>/g);
  if (formMatch) {
    console.log(`\nFound ${formMatch.length} forms`);
    formMatch.forEach((form, i) => {
      if (form.includes('カート') || form.includes('cart') || form.includes('add')) {
        console.log(`\nForm ${i} contains cart/add text:`);
        console.log(form.substring(0, 300));
      }
    });
  }
  
  // Look for sold-out specific indicators in the product section
  console.log('\n\n=== Sold Out Indicators (in product section only) ===');
  
  // Extract product section
  const productMatch = html.match(/<div[^>]*class="[^"]*product[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<footer/i);
  if (productMatch) {
    const productSection = productMatch[1];
    
    if (productSection.includes('売り切れ')) {
      console.log('✗ Found 売り切れ in product section');
    }
    if (productSection.includes('在庫なし')) {
      console.log('✗ Found 在庫なし in product section');
    }
    if (productSection.includes('売切れ')) {
      console.log('✗ Found 売切れ in product section');
    }
  }
}

async function main() {
  await checkHTML(
    'https://torecacamp-pokemon.com/products/rc_it3i3r1n4hnp_6xme',
    'Serperior ex - 167/086'
  );
}

main().catch(console.error);
