#!/usr/bin/env node
/**
 * Test stock status detection for Pawniard (sv11b 147)
 * Usage: node scripts/test-stock-detection.js
 */

const fetch = require('node-fetch');

const JPY_TO_USD = 0.0065;

async function testJapanToreca() {
  console.log('🔍 Testing Japan-Toreca stock detection...\n');

  const searchUrl = 'https://shop.japan-toreca.com/search?q=sv11b+147';

  try {
    const res = await fetch(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();

    // Check for products
    const productMatches = [...html.matchAll(/href="(\/products\/pokemon-\d+[^"]*)"/g)];
    const uniqueUrls = [...new Set(productMatches.map(m => 'https://shop.japan-toreca.com' + m[1]))];

    console.log(`Found ${uniqueUrls.length} products`);

    for (const url of uniqueUrls.slice(0, 3)) {
      console.log(`\n--- Testing: ${url} ---`);

      const pRes = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const pHtml = await pRes.text();

      // Extract heading
      const headingMatch = pHtml.match(/<h1[^>]*>(.*?)<\/h1>/);
      const heading = headingMatch ? headingMatch[1] : '';
      console.log(`Title: ${heading}`);

      // Extract price
      const priceMatch = pHtml.match(/<span[^>]*class="[^"]*price[^"]*"[^>]*>\s*¥\s*([\d,]+)/i);
      const priceJPY = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0;
      console.log(`Price: ¥${priceJPY}`);

      // Stock detection tests
      const inventoryMatch = pHtml.match(/在庫数[:\s]*([\d]+)/);
      const inventoryCount = inventoryMatch ? parseInt(inventoryMatch[1]) : null;
      console.log(`Inventory count: ${inventoryCount !== null ? inventoryCount : 'Not found'}`);

      const hasExplicitNoStock = pHtml.includes('在庫数: 0') ||
                                 pHtml.includes('在庫数: 売り切れ');
      console.log(`Explicit no stock: ${hasExplicitNoStock}`);

      const hasAddToCart = pHtml.includes('data-add-to-cart-text="カートに追加"') ||
                          pHtml.match(/<button[^>]*name="add"[^>]*>.*カートに追加/);
      console.log(`Has add to cart button: ${hasAddToCart}`);

      const isButtonDisabled = pHtml.match(/<button[^>]*name="add"[^>]*disabled[^>]*>/);
      console.log(`Button disabled: ${!!isButtonDisabled}`);

      const hasInStockMsg = pHtml.includes('在庫あり') ||
                           pHtml.match(/([\d]+)点在庫/);
      console.log(`Has in-stock message: ${!!hasInStockMsg}`);

      // Determine stock status
      let inStock = true;
      if (inventoryCount === 0 || hasExplicitNoStock) inStock = false;
      else if (inventoryCount !== null && inventoryCount > 0) inStock = true;
      else if (isButtonDisabled) inStock = false;
      else if (!hasAddToCart && !hasInStockMsg) inStock = false;

      console.log(`✓ Stock Status: ${inStock ? 'IN STOCK ✓' : 'OUT OF STOCK ✗'}`);
    }

  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
}

async function testTorecaCamp() {
  console.log('\n\n🔍 Testing TorecaCamp stock detection...\n');

  const searchUrl = 'https://torecacamp-pokemon.com/search?q=sv11b+147';

  try {
    const res = await fetch(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();

    // Extract product URLs
    const productMatches = [...html.matchAll(/href="(\/products\/rc_[^"?]*)/g)];
    const uniqueUrls = [...new Set(productMatches.map(m => 'https://torecacamp-pokemon.com' + m[1]))];

    console.log(`Found ${uniqueUrls.length} products`);

    for (const url of uniqueUrls.slice(0, 3)) {
      console.log(`\n--- Testing: ${url} ---`);

      const pRes = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const pHtml = await pRes.text();

      // Extract title
      const titleMatch = pHtml.match(/<title>([\s\S]*?)<\/title>/);
      const title = titleMatch ? titleMatch[1].trim() : '';
      console.log(`Title: ${title}`);

      // Get variants
      const variantsMatch = pHtml.match(/variants":\s*(\[.*?\])[,;]/);
      if (!variantsMatch) {
        console.log('No variants found');
        continue;
      }

      const variants = JSON.parse(variantsMatch[1]);

      // Check for sold out indicators
      const hasSoldOutText = pHtml.includes('売り切れ') ||
                            pHtml.includes('売切れ') ||
                            pHtml.includes('Sold Out');
      console.log(`Has sold out text in HTML: ${hasSoldOutText}`);

      // Check for "在庫なし"
      const hasNoStockText = pHtml.includes('在庫なし') || pHtml.includes('在庫数: 0');
      console.log(`Has '在庫なし': ${hasNoStockText}`);

      // Analyze each variant
      console.log('\nVariants:');
      variants.forEach(v => {
        const price = Math.round(v.price / 100);
        const title = v.public_title || v.title;

        // Stock checks
        let inStock = v.available !== false;
        if (v.inventory_quantity !== undefined) {
          inStock = inStock && v.inventory_quantity > 0;
        }
        if (hasSoldOutText || hasNoStockText) {
          inStock = false;
        }
        if (!price || price === 0) {
          inStock = false;
        }

        console.log(`  ${title}: ¥${price} - ${inStock ? 'IN STOCK ✓' : 'OUT OF STOCK ✗'} (available=${v.available}, inventory=${v.inventory_quantity})`);
      });
    }

  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Testing Stock Status Detection for Pawniard (SV11B 147)');
  console.log('='.repeat(60));

  await testJapanToreca();
  await testTorecaCamp();

  console.log('\n' + '='.repeat(60));
  console.log('Test Complete!');
  console.log('='.repeat(60));
}

main().catch(console.error);
