#!/usr/bin/env node
/**
 * Scrape TorecaCamp variants (A, A-, B) separately
 * Usage: node scripts/scrape-variants.js
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const JPY_TO_USD = 0.0065;
const DELAY_MS = 1000;

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html',
      }
    });
    if (!res.ok) return null;
    return await res.text();
  } catch (e) {
    return null;
  }
}

function extractVariantData(html) {
  const variants = [];
  
  // Look for Shopify variant data in JSON
  const variantMatches = html.matchAll(/"id":\s*(\d+)[^}]*"title":\s*"([^"]+)"[^}]*"price":\s*(\d+)[^}]*"inventory_quantity":\s*(\d+)/g);
  
  for (const match of variantMatches) {
    const variantId = match[1];
    const title = match[2]; // e.g., "A", "A-", "B"
    const price = parseInt(match[3]);
    const stock = parseInt(match[4]);
    
    if (title.match(/^[AB\-]+$/)) {
      variants.push({
        variantId,
        title,
        price,
        inStock: stock > 0
      });
    }
  }
  
  return variants;
}

function extractCardInfo(html) {
  // Get card name and number from title
  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  const title = titleMatch ? titleMatch[1] : '';
  
  const nameMatch = title.match(/^(.+?)\s+AR|M3/);
  const name = nameMatch ? nameMatch[1].trim() : '';
  
  const numberMatch = title.match(/(\d{3}\/\d{3})/);
  const cardNumber = numberMatch ? numberMatch[1] : '';
  
  return { name, cardNumber };
}

async function scrapeTorecaCampVariants(productUrl) {
  // First, fetch main page to get variant list
  const html = await fetchPage(productUrl);
  if (!html) return null;
  
  const variants = extractVariantData(html);
  
  if (variants.length === 0) {
    // Fallback: get single price from page
    const priceMatch = html.match(/"price":\s*(\d+)/);
    if (priceMatch) {
      const qualityMatch = html.match(/コンディション.*?(A\-|A|B)/);
      return [{
        title: qualityMatch ? qualityMatch[1] : 'A',
        price: parseInt(priceMatch[1]),
        inStock: !html.includes('Sold Out') && !html.includes('在庫なし')
      }];
    }
    return null;
  }
  
  return variants;
}

async function main() {
  console.log('🚀 Scraping TorecaCamp variants...\n');
  
  const pricesPath = path.join(__dirname, '..', 'data', 'prices.json');
  const data = JSON.parse(fs.readFileSync(pricesPath, 'utf-8'));
  
  let updated = 0;
  
  for (let i = 0; i < data.opportunities.length; i++) {
    const card = data.opportunities[i];
    const tcEntry = card.japanesePrices.find(p => p.source === 'torecacamp');
    
    if (!tcEntry) continue;
    
    console.log(`[${i + 1}/33] ${card.name}`);
    await delay(DELAY_MS);
    
    const variants = await scrapeTorecaCampVariants(tcEntry.url);
    
    if (!variants || variants.length === 0) {
      console.log('  ✗ Failed to get variants');
      continue;
    }
    
    console.log(`  Found ${variants.length} variant(s):`);
    
    // Find best A- or B price
    const abVariants = variants.filter(v => v.title === 'A-' || v.title === 'B');
    const bestVariant = abVariants.length > 0 
      ? abVariants.reduce((min, v) => v.price < min.price ? v : min)
      : variants.find(v => v.title === 'A');
    
    if (bestVariant) {
      console.log(`  ${bestVariant.title}: ¥${bestVariant.price} ${bestVariant.inStock ? '✓' : '✗'}`);
      
      if (bestVariant.price !== tcEntry.priceJPY || bestVariant.title !== tcEntry.quality) {
        console.log(`  💰 Updated: ${tcEntry.quality || '?'}/¥${tcEntry.priceJPY} → ${bestVariant.title}/¥${bestVariant.price}`);
        tcEntry.priceJPY = bestVariant.price;
        tcEntry.priceUSD = Math.round(bestVariant.price * JPY_TO_USD * 100) / 100;
        tcEntry.quality = bestVariant.title;
        tcEntry.inStock = bestVariant.inStock;
        
        // Add variant ID to URL if not A
        if (bestVariant.variantId && bestVariant.title !== 'A') {
          tcEntry.url = tcEntry.url.split('?')[0] + `?variant=${bestVariant.variantId}`;
        }
        updated++;
      } else {
        console.log(`  ✓ Unchanged`);
      }
    }
    
    // Update lowest price
    const jtEntry = card.japanesePrices.find(p => p.source === 'japan-toreca');
    const allPrices = [tcEntry, jtEntry].filter(p => p && p.inStock);
    
    if (allPrices.length > 0) {
      const lowest = allPrices.reduce((min, p) => p.priceUSD < min.priceUSD ? p : min);
      card.lowestJapanesePrice = lowest.priceUSD;
      
      // Recalculate arbitrage
      if (card.usPrice) {
        const profit = card.usPrice.marketPrice - lowest.priceUSD;
        card.marginPercent = Math.round((profit / lowest.priceUSD) * 100);
        card.marginAmount = Math.round(profit * 100) / 100;
        card.isViable = card.marginPercent > 20;
        if (card.arbitrageUS) {
          card.arbitrageUS.profitAmount = card.marginAmount;
          card.arbitrageUS.profitPercent = card.marginPercent;
          card.arbitrageUS.isViable = card.isViable;
          card.arbitrageUS.japanPriceUSD = lowest.priceUSD;
        }
      }
    }
    
    // Update isLowest flags
    card.japanesePrices.forEach(p => {
      p.isLowest = p.inStock && p.priceUSD === card.lowestJapanesePrice;
    });
  }
  
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(pricesPath, JSON.stringify(data, null, 2));
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Done!');
  console.log('='.repeat(50));
  console.log(`Updated: ${updated} cards`);
}

main().catch(console.error);
