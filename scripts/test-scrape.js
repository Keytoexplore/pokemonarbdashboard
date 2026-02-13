#!/usr/bin/env node
/**
 * Test scraper to debug price extraction
 */

const puppeteer = require('puppeteer');

async function testScrape(url, name) {
  console.log(`\n🔍 Testing: ${name}`);
  console.log(`URL: ${url}`);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    // Try multiple selectors
    const priceSelectors = [
      '.product-price',
      '.price',
      '[class*="price"]',
      '.money',
      '.product__price'
    ];
    
    for (const selector of priceSelectors) {
      try {
        const text = await page.$eval(selector, el => el.textContent).catch(() => null);
        if (text) console.log(`  ${selector}: "${text.trim()}"`);
      } catch (e) {}
    }
    
    // Also check page content
    const html = await page.content();
    const yenMatches = html.match(/¥[\d,]+/g);
    if (yenMatches) {
      console.log(`  All ¥ matches: ${[...new Set(yenMatches)].slice(0, 5).join(', ')}`);
    }
    
  } catch (error) {
    console.log(`  Error: ${error.message}`);
  }
  
  await browser.close();
}

async function main() {
  // Test Tyrunt
  await testScrape(
    'https://shop.japan-toreca.com/products/pokemon-227740-a-damaged',
    'Tyrunt (japan-toreca)'
  );
  
  // Test Spewpa
  await testScrape(
    'https://torecacamp-pokemon.com/products/rc_itpqrm9yul95_4ycx',
    'Spewpa (torecacamp)'
  );
}

main();
