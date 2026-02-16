#!/usr/bin/env node
/**
 * Scrape TorecaCamp with variant support
 * Usage: node scripts/scrape-torecacamp.js
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const JPY_TO_USD = 0.0065;
const DELAY_MS = 800;

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

function extractVariants(html) {
  // Find variants JSON array in page
  const variantsMatch = html.match(/variants":\s*(\[.*?\])[,;]/);
  if (!variantsMatch) return null;

  // Check for sold out indicators in the page HTML (backup detection)
  const hasSoldOutText = html.includes('売り切れ') ||
                        html.includes('売切れ') ||
                        html.includes('Sold Out') ||
                        html.includes('sold out');

  // Check for "在庫なし" (out of stock)
  const hasNoStockText = html.includes('在庫なし') ||
                         html.includes('在庫数: 0');

  try {
    const variants = JSON.parse(variantsMatch[1]);
    return variants.map(v => {
      // IMPROVED STOCK DETECTION
      // 1. Check available field
      let inStock = v.available !== false && v.available !== 'false';

      // 2. Check inventory_quantity if available
      if (v.inventory_quantity !== undefined) {
        inStock = inStock && v.inventory_quantity > 0;
      }

      // 3. Check HTML for sold out text
      if (hasSoldOutText || hasNoStockText) {
        inStock = false;
      }

      // 4. Fallback: if no price or price is 0, it's out of stock
      const price = Math.round(v.price / 100);
      if (!price || price === 0) {
        inStock = false;
      }

      return {
        variantId: v.id.toString(),
        title: v.public_title || v.title,
        price, // Convert cents to yen
        inStock
      };
    }).filter(v => {
      // Only keep A, A-, B variants
      const quality = v.title.match(/([AB\-]+)/);
      return quality && ['A', 'A-', 'B'].includes(quality[1]);
    });
  } catch (e) {
    return null;
  }
}

function cleanQuality(title) {
  const match = title.match(/【状態([AB\-]+)】/);
  return match ? match[1] : (title.match(/([AB\-]+)/)?.[1] || null);
}

async function main() {
  console.log('🚀 Scraping TorecaCamp with variant support...\n');
  
  const pricesPath = path.join(__dirname, '..', 'data', 'prices.json');
  const data = JSON.parse(fs.readFileSync(pricesPath, 'utf-8'));
  
  let updated = 0;
  
  for (let i = 0; i < data.opportunities.length; i++) {
    const card = data.opportunities[i];
    const tcEntry = card.japanesePrices.find(p => p.source === 'torecacamp');
    
    if (!tcEntry) continue;
    
    console.log(`[${i + 1}/${data.opportunities.length}] ${card.name}`);
    await delay(DELAY_MS);
    
    const html = await fetchPage(tcEntry.url.split('?')[0]);
    
    if (!html) {
      console.log('  ✗ Failed to fetch');
      continue;
    }
    
    const variants = extractVariants(html);
    
    if (!variants || variants.length === 0) {
      console.log('  ✗ No variants found');
      continue;
    }
    
    console.log(`  Variants: ${variants.map(v => `${cleanQuality(v.title)}:¥${v.price}`).join(', ')}`);
    
    // Find best A-, B, or A (in that order of preference)
    const targetVariant = variants.find(v => cleanQuality(v.title) === 'A-') 
                       || variants.find(v => cleanQuality(v.title) === 'B')
                       || variants.find(v => cleanQuality(v.title) === 'A');
    
    if (!targetVariant) {
      console.log('  ✗ No A/-/B variant found');
      continue;
    }
    
    const quality = cleanQuality(targetVariant.title);
    const { price, inStock, variantId } = targetVariant;
    
    // Build variant URL
    const baseUrl = tcEntry.url.split('?')[0];
    const variantUrl = quality !== 'A' ? `${baseUrl}?variant=${variantId}` : baseUrl;
    
    if (price !== tcEntry.priceJPY || quality !== tcEntry.quality || variantUrl !== tcEntry.url) {
      console.log(`  💰 ${tcEntry.quality || '?'}/¥${tcEntry.priceJPY} → ${quality}/¥${price} ${inStock ? '✓' : '✗'}`);
      tcEntry.priceJPY = price;
      tcEntry.priceUSD = Math.round(price * JPY_TO_USD * 100) / 100;
      tcEntry.quality = quality;
      tcEntry.inStock = inStock;
      tcEntry.url = variantUrl;
      updated++;
    } else {
      console.log(`  ✓ Unchanged: ${quality}/¥${price}`);
      tcEntry.inStock = inStock;
    }
    
    // Recalculate lowest price across both sources
    const jtEntry = card.japanesePrices.find(p => p.source === 'japan-toreca');
    const allPrices = [tcEntry, jtEntry].filter(p => p && p.inStock);
    
    if (allPrices.length > 0) {
      const lowest = allPrices.reduce((min, p) => p.priceUSD < min.priceUSD ? p : min);
      card.lowestJapanesePrice = lowest.priceUSD;
      
      // Update flags
      card.japanesePrices.forEach(p => {
        p.isLowest = p.inStock && p.priceUSD === card.lowestJapanesePrice;
      });
      
      // Recalculate arbitrage
      if (card.usPrice) {
        const profit = card.usPrice.marketPrice - lowest.priceUSD;
        card.marginPercent = Math.round((profit / lowest.priceUSD) * 100);
        card.marginAmount = Math.round(profit * 100) / 100;
        card.isViable = card.marginPercent > 20;
        
        if (!card.arbitrageUS) card.arbitrageUS = {};
        card.arbitrageUS.profitAmount = card.marginAmount;
        card.arbitrageUS.profitPercent = card.marginPercent;
        card.arbitrageUS.isViable = card.isViable;
        card.arbitrageUS.japanPriceUSD = lowest.priceUSD;
        card.arbitrageUS.usMarketPrice = card.usPrice.marketPrice;
      }
    }
  }
  
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(pricesPath, JSON.stringify(data, null, 2));
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Done!');
  console.log('='.repeat(50));
  console.log(`Updated: ${updated} cards`);
}

main().catch(console.error);
