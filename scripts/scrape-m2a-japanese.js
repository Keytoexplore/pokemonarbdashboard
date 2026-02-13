#!/usr/bin/env node
/**
 * Scrape M2a cards from Japan-Toreca and TorecaCamp
 * Usage: node scripts/scrape-m2a-japanese.js
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const JPY_TO_USD = 0.0065;
const DELAY_MS = 1000;

// Load M2a card list from API
const m2aCards = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'm2a-api-cards.json'), 'utf-8'));

// Filter for AR, SR, SAR only
const targetCards = m2aCards.filter(c => 
  ['Art Rare', 'Super Rare', 'Special Art Rare'].includes(c.rarity)
);

console.log(`Found ${targetCards.length} M2a cards to search for (AR/SR/SAR)\n`);

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchJapanToreca(cardName, cardNumber) {
  // Simplify card name for search (remove special characters)
  const searchName = cardName
    .replace(/'/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 2)  // Just first 2 words
    .join(' ');
  
  const searchUrl = `https://shop.japan-toreca.com/search?q=m2a+${encodeURIComponent(searchName)}`;
  
  try {
    const res = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (!res.ok) return null;
    const html = await res.text();
    
    // Look for product links
    const productMatch = html.match(/href="(\/products\/pokemon-\d+[^"]*)"/);
    if (!productMatch) return null;
    
    const productUrl = 'https://shop.japan-toreca.com' + productMatch[1];
    
    // Fetch product page
    await delay(500);
    const productRes = await fetch(productUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (!productRes.ok) return null;
    const productHtml = await productRes.text();
    
    // Extract price
    const priceMatch = productHtml.match(/<span[^>]*class="[^"]*price[^"]*"[^>]*>\s*¥\s*([\d,]+)/i);
    if (!priceMatch) return null;
    
    const priceJPY = parseInt(priceMatch[1].replace(/,/g, ''));
    
    // Check stock
    const inStock = !productHtml.includes('売り切れ');
    
    // Extract quality
    const qualityMatch = productHtml.match(/【状態([AB\-]+)】/);
    const quality = qualityMatch ? qualityMatch[1] : 'A';
    
    return {
      source: 'japan-toreca',
      priceJPY,
      priceUSD: Math.round(priceJPY * JPY_TO_USD * 100) / 100,
      quality,
      inStock,
      url: productUrl
    };
  } catch (e) {
    return null;
  }
}

async function searchTorecaCamp(cardName, cardNumber) {
  const searchName = cardName
    .replace(/'/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 2)
    .join(' ');
  
  const searchUrl = `https://torecacamp-pokemon.com/search?q=${encodeURIComponent(searchName)}+m2a`;
  
  try {
    const res = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (!res.ok) return null;
    const html = await res.text();
    
    // Look for product links
    const productMatch = html.match(/href="(\/products\/rc_[^"]*)"/);
    if (!productMatch) return null;
    
    const productUrl = 'https://torecacamp-pokemon.com' + productMatch[1];
    
    // Fetch product page
    await delay(500);
    const productRes = await fetch(productUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (!productRes.ok) return null;
    const productHtml = await productRes.text();
    
    // Extract variants
    const variantsMatch = productHtml.match(/variants":\s*(\[.*?\])[,;]/);
    if (variantsMatch) {
      const variants = JSON.parse(variantsMatch[1]);
      
      // Find best A-/B variant
      const targetVariant = variants.find(v => v.title?.includes('A-') || v.public_title?.includes('A-'))
                           || variants.find(v => v.title?.includes('B') || v.public_title?.includes('B'))
                           || variants[0];
      
      if (targetVariant) {
        const priceJPY = Math.round(targetVariant.price / 100);
        const quality = targetVariant.title?.match(/([AB\-]+)/)?.[1] || 
                       targetVariant.public_title?.match(/([AB\-]+)/)?.[1] || 'A';
        
        return {
          source: 'torecacamp',
          priceJPY,
          priceUSD: Math.round(priceJPY * JPY_TO_USD * 100) / 100,
          quality,
          inStock: targetVariant.available !== false,
          url: productUrl + (quality !== 'A' ? `?variant=${targetVariant.id}` : '')
        };
      }
    }
    
    // Fallback: single price
    const priceMatch = productHtml.match(/"price":\s*(\d+)/);
    if (priceMatch) {
      const priceJPY = Math.round(parseInt(priceMatch[1]) / 100);
      return {
        source: 'torecacamp',
        priceJPY,
        priceUSD: Math.round(priceJPY * JPY_TO_USD * 100) / 100,
        quality: 'A',
        inStock: !productHtml.includes('Sold Out'),
        url: productUrl
      };
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log('🔍 Scraping M2a cards from Japanese shops...\n');
  
  const results = [];
  
  for (let i = 0; i < targetCards.length; i++) {
    const card = targetCards[i];
    console.log(`[${i + 1}/${targetCards.length}] ${card.name} (${card.cardNumber})`);
    
    const japanesePrices = [];
    
    // Search Japan-Toreca
    await delay(DELAY_MS);
    const jt = await searchJapanToreca(card.name, card.cardNumber);
    if (jt) {
      console.log(`  ✓ Japan-Toreca: ¥${jt.priceJPY} [${jt.quality}]`);
      japanesePrices.push(jt);
    } else {
      console.log(`  ✗ Japan-Toreca: Not found`);
    }
    
    // Search TorecaCamp
    await delay(DELAY_MS);
    const tc = await searchTorecaCamp(card.name, card.cardNumber);
    if (tc) {
      console.log(`  ✓ TorecaCamp: ¥${tc.priceJPY} [${tc.quality}]`);
      japanesePrices.push(tc);
    } else {
      console.log(`  ✗ TorecaCamp: Not found`);
    }
    
    if (japanesePrices.length > 0) {
      // Find lowest in-stock price
      const inStock = japanesePrices.filter(p => p.inStock);
      const lowest = inStock.length > 0 
        ? inStock.reduce((min, p) => p.priceUSD < min.priceUSD ? p : min)
        : japanesePrices[0];
      
      results.push({
        id: `M2a-${card.cardNumber.replace('/', '-')}-${card.rarity === 'Art Rare' ? 'AR' : card.rarity === 'Super Rare' ? 'SR' : 'SAR'}`,
        name: card.name,
        cardNumber: card.cardNumber,
        rarity: card.rarity === 'Art Rare' ? 'AR' : card.rarity === 'Super Rare' ? 'SR' : 'SAR',
        set: 'M2a',
        japanesePrices: japanesePrices.map(p => ({...p, isLowest: p.priceUSD === lowest.priceUSD})),
        lowestJapanesePrice: lowest.priceUSD,
        usPrice: null,
        arbitrageUS: null,
        marginPercent: 0,
        marginAmount: 0,
        lastUpdated: new Date().toISOString(),
        isViable: false
      });
    }
    
    console.log('');
  }
  
  console.log('='.repeat(50));
  console.log(`✅ Scraped ${results.length}/${targetCards.length} cards`);
  console.log('='.repeat(50));
  
  // Save results
  fs.writeFileSync('data/m2a-scraped.json', JSON.stringify(results, null, 2));
  console.log('\n✓ Saved to data/m2a-scraped.json');
  
  // Show summary
  const byRarity = {};
  results.forEach(c => {
    if (!byRarity[c.rarity]) byRarity[c.rarity] = 0;
    byRarity[c.rarity]++;
  });
  
  console.log('\nFound:');
  for (const [rarity, count] of Object.entries(byRarity)) {
    console.log(`  ${rarity}: ${count} cards`);
  }
}

main().catch(console.error);
