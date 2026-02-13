#!/usr/bin/env node
/**
 * Scrape Japanese prices using fetch + cheerio (no browser)
 * Usage: node scripts/scrape-all.js
 */

const fs = require('fs');
const path = require('path');

const JPY_TO_USD = 0.0065;
const DELAY_MS = 1000;

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, retries = 2) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,ja;q=0.8',
        }
      });
      if (response.ok) return await response.text();
    } catch (e) {}
    if (i < retries - 1) await delay(500);
  }
  return null;
}

function extractJapanTorecaPrice(html) {
  // Look for product price class first (most specific)
  const priceMatch = html.match(/<span[^>]*class="[^"]*(?:product-price|price)[^"]*"[^>]*>\s*¥\s*([\d,]+)/i);
  if (priceMatch) {
    const price = parseInt(priceMatch[1].replace(/,/g, ''));
    if (price > 10 && price < 100000) return price;
  }
  
  // Fallback to first yen amount in body
  const yenMatch = html.match(/¥\s*([\d,]+)/);
  if (yenMatch) {
    const price = parseInt(yenMatch[1].replace(/,/g, ''));
    if (price > 10 && price < 100000) return price;
  }
  return null;
}

function extractTorecaCampPrice(html) {
  // Look for JSON price data first (most reliable)
  const jsonMatch = html.match(/"price":\s*(\d+)/);
  if (jsonMatch) {
    const price = parseInt(jsonMatch[1]);
    if (price > 10 && price < 100000) return price;
  }
  
  // Fallback to other patterns
  const patterns = [
    /<span[^>]*class="[^"]*price[^"]*"[^>]*>¥\s*([\d,]+)/i,
    /<span[^>]*class="[^"]*money[^"]*"[^>]*>¥\s*([\d,]+)/i,
    /data-price="([\d]+)"/,
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const price = parseInt(match[1].replace(/,/g, ''));
      if (price > 10 && price < 100000) return price;
    }
  }
  return null;
}

function checkStock(html, source) {
  if (source === 'japan-toreca') {
    return !html.includes('売り切れ') && 
           !html.includes('在庫数: 0') && 
           !html.includes('在庫数: 売り切れ');
  }
  return !html.includes('Sold Out') && 
         !html.includes('sold out') && 
         !html.includes('在庫なし');
}

function extractQuality(html) {
  const match = html.match(/【状態([A\-]+)】/) || 
                html.match(/ランク[：:]\s*([AB\-]+)/) ||
                html.match(/コンディション.*?([AB\-]+)/);
  return match ? match[1] : null;
}

async function scrapeAll() {
  console.log('🚀 Scraping all Japanese prices...\n');
  
  const pricesPath = path.join(__dirname, '..', 'data', 'prices.json');
  const data = JSON.parse(fs.readFileSync(pricesPath, 'utf-8'));
  
  let updated = 0;
  let errors = 0;
  
  for (let i = 0; i < data.opportunities.length; i++) {
    const card = data.opportunities[i];
    console.log(`\n[${i + 1}/${data.opportunities.length}] ${card.name} (${card.cardNumber})`);
    
    let cardUpdated = false;
    
    for (const jp of card.japanesePrices) {
      await delay(DELAY_MS);
      process.stdout.write(`  🔍 ${jp.source}... `);
      
      const html = await fetchWithRetry(jp.url);
      
      if (!html) {
        console.log('✗ Fetch failed');
        errors++;
        continue;
      }
      
      const price = jp.source === 'japan-toreca' 
        ? extractJapanTorecaPrice(html)
        : extractTorecaCampPrice(html);
      
      if (!price || price < 10) {
        console.log('✗ No price found');
        errors++;
        continue;
      }
      
      const inStock = checkStock(html, jp.source);
      const quality = extractQuality(html) || jp.quality;
      
      if (price !== jp.priceJPY) {
        console.log(`💰 ¥${jp.priceJPY} → ¥${price} ${inStock ? '✓' : '✗'} [${quality || '?'}]`);
        jp.priceJPY = price;
        jp.priceUSD = Math.round(price * JPY_TO_USD * 100) / 100;
        jp.inStock = inStock;
        if (quality) jp.quality = quality;
        updated++;
        cardUpdated = true;
      } else {
        console.log(`✓ ¥${price} ${inStock ? '✓' : '✗'}`);
        jp.inStock = inStock;
      }
    }
    
    // Update lowest price
    if (cardUpdated) {
      const inStock = card.japanesePrices.filter(p => p.inStock);
      if (inStock.length > 0) {
        const lowest = inStock.reduce((min, p) => p.priceUSD < min.priceUSD ? p : min);
        card.lowestJapanesePrice = lowest.priceUSD;
        
        // Recalculate arbitrage
        if (card.usPrice) {
          const profit = card.usPrice.marketPrice - lowest.priceUSD;
          card.marginPercent = Math.round((profit / lowest.priceUSD) * 100);
          card.marginAmount = Math.round(profit * 100) / 100;
          card.arbitrageUS = {
            profitAmount: card.marginAmount,
            profitPercent: card.marginPercent,
            isViable: card.marginPercent > 20,
            japanPriceUSD: lowest.priceUSD,
            usMarketPrice: card.usPrice.marketPrice
          };
          card.isViable = card.marginPercent > 20;
        }
      }
    }
  }
  
  // Save
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(pricesPath, JSON.stringify(data, null, 2));
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Complete!');
  console.log('='.repeat(50));
  console.log(`Updated: ${updated} prices`);
  console.log(`Errors: ${errors}`);
}

scrapeAll();
