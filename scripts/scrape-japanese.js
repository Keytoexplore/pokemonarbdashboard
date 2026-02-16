#!/usr/bin/env node
/**
 * Scrape Japanese prices - Fixed version
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const JPY_TO_USD = 0.0065;
const DELAY_MS = 1500;

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractPrice(text) {
  if (!text) return null;
  // Look for yen symbol followed by digits with optional commas
  const match = text.match(/¥\s*([\d,]+)/);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''));
  }
  return null;
}

async function scrapeWithPuppeteer(browser, url, source) {
  const page = await browser.newPage();
  try {
    await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 20000 
    });
    
    // Get all text content
    const bodyText = await page.evaluate(() => document.body.innerText);
    const html = await page.content();
    
    // Extract price using multiple methods
    let priceJPY = null;
    
    // Method 1: Look for product price elements
    try {
      const priceText = await page.$eval('.product-price, .price, .money', el => el.innerText);
      priceJPY = extractPrice(priceText);
    } catch (e) {}
    
    // Method 2: Search in body text
    if (!priceJPY) {
      priceJPY = extractPrice(bodyText);
    }
    
    // Method 3: Search in HTML
    if (!priceJPY) {
      const htmlMatch = html.match(/¥\s*([\d,]+)/);
      if (htmlMatch) {
        priceJPY = parseInt(htmlMatch[1].replace(/,/g, ''));
      }
    }
    
    if (!priceJPY || priceJPY < 10) {
      return null;
    }

    // IMPROVED STOCK DETECTION
    // Check for sold out indicators
    const hasSoldOutText = bodyText.includes('売り切れ') ||
                          bodyText.includes('売切れ') ||
                          bodyText.includes('Sold Out') ||
                          bodyText.includes('sold out');

    // Check inventory count patterns
    const inventoryMatch = bodyText.match(/在庫数[:\s]*([\d]+)/);
    const inventoryCount = inventoryMatch ? parseInt(inventoryMatch[1]) : null;

    // Check for "在庫なし" (out of stock)
    const hasNoStockText = bodyText.includes('在庫なし') ||
                           bodyText.includes('在庫数: 0') ||
                           bodyText.includes('在庫数: 売り切れ');

    // Check for in-stock indicators
    const hasInStockMessage = bodyText.includes('在庫あり') ||
                              (inventoryCount !== null && inventoryCount > 0);

    // Check for add to cart button
    const hasAddToCartButton = bodyText.includes('カートに追加');

    // Determine stock status
    let inStock = true;

    // Priority 1: If inventory is explicitly 0 or has explicit no-stock text
    if (inventoryCount === 0 || hasNoStockText) {
      inStock = false;
    }
    // Priority 2: If we have positive inventory count, it's in stock
    else if (inventoryCount !== null && inventoryCount > 0) {
      inStock = true;
    }
    // Priority 3: If no add to cart button AND no in-stock message, likely out of stock
    else if (!hasAddToCartButton && !hasInStockMessage) {
      inStock = false;
    }
    
    // Extract quality
    const qualityMatch = bodyText.match(/【状態([A\-]+)】/) || 
                        bodyText.match(/ランク[：:]\s*([AB\-]+)/) ||
                        bodyText.match(/状態.*?(A\-|A|B)/);
    const quality = qualityMatch ? qualityMatch[1] : null;
    
    return {
      priceJPY,
      priceUSD: Math.round(priceJPY * JPY_TO_USD * 100) / 100,
      quality,
      inStock
    };
    
  } catch (error) {
    console.log(`    ✗ ${error.message.substring(0, 60)}`);
    return null;
  } finally {
    await page.close();
  }
}

async function main() {
  console.log('🚀 Scraping Japanese prices...\n');
  
  const pricesPath = path.join(__dirname, '..', 'data', 'prices.json');
  const data = JSON.parse(fs.readFileSync(pricesPath, 'utf-8'));
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  let updatedCount = 0;
  let errorCount = 0;
  
  try {
    for (let i = 0; i < data.opportunities.length; i++) {
      const card = data.opportunities[i];
      console.log(`[${i + 1}/${data.opportunities.length}] ${card.name} (${card.cardNumber})`);
      
      for (const jp of card.japanesePrices) {
        await delay(DELAY_MS);
        console.log(`    🔍 ${jp.source}...`);
        
        const result = await scrapeWithPuppeteer(browser, jp.url, jp.source);
        
        if (result && result.priceJPY > 0) {
          if (result.priceJPY !== jp.priceJPY) {
            console.log(`    💰 ¥${jp.priceJPY} → ¥${result.priceJPY} (${result.inStock ? '✓' : '✗'})${result.quality ? ` [${result.quality}]` : ''}`);
            jp.priceJPY = result.priceJPY;
            jp.priceUSD = result.priceUSD;
            updatedCount++;
          } else {
            console.log(`    ✓ Unchanged: ¥${result.priceJPY}`);
          }
          jp.inStock = result.inStock;
          if (result.quality) jp.quality = result.quality;
        } else {
          console.log(`    ⚠ No price found`);
          errorCount++;
        }
      }
    }
    
    // Save
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(pricesPath, JSON.stringify(data, null, 2));
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Done!');
    console.log('='.repeat(50));
    console.log(`Updated: ${updatedCount} prices`);
    console.log(`Errors: ${errorCount}`);
    
  } finally {
    await browser.close();
  }
}

main();
