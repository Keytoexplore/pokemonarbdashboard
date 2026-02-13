#!/usr/bin/env node
/**
 * Scrape M2a cards using bulk search (m2a ar, m2a sr, m2a sar)
 * Usage: node scripts/scrape-m2a-bulk.js
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const JPY_TO_USD = 0.0065;
const DELAY_MS = 1500;

const pricesPath = path.join(__dirname, '..', 'data', 'prices.json');
const data = JSON.parse(fs.readFileSync(pricesPath, 'utf-8'));

// Get M2a cards that need Japanese prices
const m2aCards = data.opportunities.filter(c => c.set === 'M2a' && c.japanesePrices.length === 0);

console.log(`Scraping ${m2aCards.length} M2a cards...\n`);

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchTorecaCampBulk(rarity) {
  const rarityTerm = rarity === 'AR' ? 'ar' : rarity === 'SR' ? 'sr' : 'sar';
  const url = `https://torecacamp-pokemon.com/search?type=product&options%5Bprefix%5D=last&options%5Bunavailable_products%5D=last&q=m2a+${rarityTerm}`;
  
  console.log(`Searching TorecaCamp: m2a ${rarityTerm}...`);
  
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    
    // Find all product links
    const productMatches = [...html.matchAll(/href="(\/products\/rc_[^"]*)"/g)];
    const uniqueUrls = [...new Set(productMatches.map(m => 'https://torecacamp-pokemon.com' + m[1]))];
    
    console.log(`  Found ${uniqueUrls.length} products\n`);
    
    const results = [];
    
    for (const productUrl of uniqueUrls.slice(0, 20)) { // Limit to 20
      await delay(1000);
      
      try {
        const pRes = await fetch(productUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const pHtml = await pRes.text();
        
        // Extract title
        const titleMatch = pHtml.match(/<title>(.*?)<\/title>/);
        const title = titleMatch ? titleMatch[1] : '';
        
        // Parse card name and number from title
        // Example: "N's Zekrom AR M2a 210/193"
        const cardMatch = title.match(/^(.+?)\s+(AR|SR|SAR)\s+M2a\s+(\d+\/\d+)/);
        if (!cardMatch) continue;
        
        const name = cardMatch[1].trim();
        const cardRarity = cardMatch[2];
        const cardNumber = cardMatch[3];
        
        // Extract variants
        const variantsMatch = pHtml.match(/variants":\s*(\[.*?\])[,;]/);
        if (!variantsMatch) continue;
        
        const variants = JSON.parse(variantsMatch[1]);
        
        // Find best A-/B variant
        const target = variants.find(v => (v.title || v.public_title)?.includes('A-'))
                    || variants.find(v => (v.title || v.public_title)?.includes('B'))
                    || variants[0];
        
        if (!target) continue;
        
        const priceJPY = Math.round(target.price / 100);
        const quality = (target.title || target.public_title)?.match(/([AB\-]+)/)?.[1] || 'A';
        const variantId = target.id;
        
        results.push({
          name,
          cardNumber,
          rarity: cardRarity,
          source: 'torecacamp',
          priceJPY,
          priceUSD: Math.round(priceJPY * JPY_TO_USD * 100) / 100,
          quality,
          inStock: target.available !== false,
          url: productUrl + (quality !== 'A' ? `?variant=${variantId}` : '')
        });
        
        console.log(`  ✓ ${name} (${cardNumber}) - ¥${priceJPY} [${quality}]`);
        
      } catch (e) {
        // Skip failed products
      }
    }
    
    return results;
  } catch (e) {
    console.log('  ✗ Error:', e.message);
    return [];
  }
}

async function searchJapanTorecaBulk(rarity) {
  const rarityTerm = rarity === 'AR' ? 'ar' : rarity === 'SR' ? 'sr' : 'sar';
  const url = `https://shop.japan-toreca.com/search?q=m2a+${rarityTerm}`;
  
  console.log(`\nSearching Japan-Toreca: m2a ${rarityTerm}...`);
  
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    
    // Check if no results
    if (html.includes('検索結果が見つかりません')) {
      console.log('  ✗ No results');
      return [];
    }
    
    // Find all product links
    const productMatches = [...html.matchAll(/href="(\/products\/pokemon-\d+[^"]*)"/g)];
    const uniqueUrls = [...new Set(productMatches.map(m => 'https://shop.japan-toreca.com' + m[1]))];
    
    console.log(`  Found ${uniqueUrls.length} products\n`);
    
    const results = [];
    
    for (const productUrl of uniqueUrls.slice(0, 20)) {
      await delay(1000);
      
      try {
        const pRes = await fetch(productUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const pHtml = await pRes.text();
        
        // Extract from heading
        const headingMatch = pHtml.match(/<h1[^>]*>(.*?)<\/h1>/);
        const heading = headingMatch ? headingMatch[1] : '';
        
        // Parse: 【状態A-】N's Zekrom AR (210/193) [M2a]
        const cardMatch = heading.match(/】\s*(.+?)\s+(AR|SR|SAR)\s*\((\d+\/\d+)\)/);
        if (!cardMatch) continue;
        
        const name = cardMatch[1].trim();
        const cardRarity = cardMatch[2];
        const cardNumber = cardMatch[3];
        
        // Extract price
        const priceMatch = pHtml.match(/<span[^>]*class="[^"]*price[^"]*"[^>]*>\s*¥\s*([\d,]+)/i);
        if (!priceMatch) continue;
        
        const priceJPY = parseInt(priceMatch[1].replace(/,/g, ''));
        
        // Extract quality
        const qualityMatch = heading.match(/【状態([AB\-]+)】/);
        const quality = qualityMatch ? qualityMatch[1] : 'A';
        
        // Check stock
        const inStock = !pHtml.includes('売り切れ');
        
        results.push({
          name,
          cardNumber,
          rarity: cardRarity,
          source: 'japan-toreca',
          priceJPY,
          priceUSD: Math.round(priceJPY * JPY_TO_USD * 100) / 100,
          quality,
          inStock,
          url: productUrl
        });
        
        console.log(`  ✓ ${name} (${cardNumber}) - ¥${priceJPY} [${quality}]`);
        
      } catch (e) {
        // Skip failed
      }
    }
    
    return results;
  } catch (e) {
    console.log('  ✗ Error:', e.message);
    return [];
  }
}

async function main() {
  const allResults = [];
  
  // Search by rarity type
  for (const rarity of ['AR', 'SR', 'SAR']) {
    await delay(DELAY_MS);
    
    const tcResults = await searchTorecaCampBulk(rarity);
    allResults.push(...tcResults);
    
    await delay(DELAY_MS);
    
    const jtResults = await searchJapanTorecaBulk(rarity);
    allResults.push(...jtResults);
  }
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Total found: ${allResults.length} prices`);
  console.log('='.repeat(50));
  
  // Merge with existing cards
  let updated = 0;
  
  for (const result of allResults) {
    const card = m2aCards.find(c => 
      c.cardNumber === result.cardNumber && 
      c.rarity === result.rarity
    );
    
    if (!card) {
      console.log(`⚠ No match for ${result.name} ${result.cardNumber}`);
      continue;
    }
    
    // Check if this source already exists
    const existingIndex = card.japanesePrices.findIndex(p => p.source === result.source);
    
    if (existingIndex >= 0) {
      // Update existing
      card.japanesePrices[existingIndex] = { ...result, isLowest: false };
    } else {
      // Add new
      card.japanesePrices.push({ ...result, isLowest: false });
    }
    
    updated++;
    
    // Recalculate lowest
    const inStock = card.japanesePrices.filter(p => p.inStock);
    if (inStock.length > 0) {
      const lowest = inStock.reduce((min, p) => p.priceUSD < min.priceUSD ? p : min);
      card.lowestJapanesePrice = lowest.priceUSD;
      card.japanesePrices.forEach(p => p.isLowest = p === lowest);
      
      // Recalculate arbitrage
      if (card.usPrice?.marketPrice > 0) {
        const profit = card.usPrice.marketPrice - lowest.priceUSD;
        card.marginPercent = Math.round((profit / lowest.priceUSD) * 100);
        card.marginAmount = Math.round(profit * 100) / 100;
        card.isViable = card.marginPercent > 20;
        card.arbitrageUS = {
          profitAmount: card.marginAmount,
          profitPercent: card.marginPercent,
          isViable: card.isViable,
          japanPriceUSD: lowest.priceUSD,
          usMarketPrice: card.usPrice.marketPrice
        };
      }
    }
  }
  
  // Save
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(pricesPath, JSON.stringify(data, null, 2));
  
  console.log(`\n✅ Updated ${updated} cards`);
}

main().catch(console.error);
