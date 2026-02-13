#!/usr/bin/env node
/**
 * Quick scrape for M2a Japanese prices - test mode
 * Usage: node scripts/scrape-m2a-quick.js [limit]
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const JPY_TO_USD = 0.0065;
const limit = parseInt(process.argv[2]) || 5; // Default to 5 cards

const pricesPath = path.join(__dirname, '..', 'data', 'prices.json');
const data = JSON.parse(fs.readFileSync(pricesPath, 'utf-8'));

// Get M2a cards without Japanese prices
const m2aCards = data.opportunities.filter(c => 
  c.set === 'M2a' && c.japanesePrices.length === 0
).slice(0, limit);

console.log(`Scraping ${m2aCards.length} M2a cards...\n`);

async function scrapeJapanToreca(name) {
  const searchName = name.replace(/'/g, '').replace(/\s+/g, ' ').trim().split(' ').slice(0, 2).join(' ');
  const url = `https://shop.japan-toreca.com/search?q=m2a+${encodeURIComponent(searchName)}`;
  
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    
    // Check if results exist
    if (html.includes('検索結果が見つかりません')) return null;
    
    // Extract first product
    const productMatch = html.match(/href="(\/products\/pokemon-\d+[^"]*)"/);
    if (!productMatch) return null;
    
    const productUrl = 'https://shop.japan-toreca.com' + productMatch[1];
    
    // Fetch product page
    const pRes = await fetch(productUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const pHtml = await pRes.text();
    
    const priceMatch = pHtml.match(/<span[^>]*class="[^"]*price[^"]*"[^>]*>\s*¥\s*([\d,]+)/i);
    if (!priceMatch) return null;
    
    const priceJPY = parseInt(priceMatch[1].replace(/,/g, ''));
    const inStock = !pHtml.includes('売り切れ');
    const qualityMatch = pHtml.match(/【状態([AB\-]+)】/);
    
    return {
      source: 'japan-toreca',
      priceJPY,
      priceUSD: Math.round(priceJPY * JPY_TO_USD * 100) / 100,
      quality: qualityMatch ? qualityMatch[1] : 'A',
      inStock,
      url: productUrl,
      isLowest: false
    };
  } catch (e) {
    return null;
  }
}

async function scrapeTorecaCamp(name) {
  const searchName = name.replace(/'/g, '').replace(/\s+/g, ' ').trim().split(' ').slice(0, 2).join(' ');
  const url = `https://torecacamp-pokemon.com/search?q=${encodeURIComponent(searchName)}+m2a`;
  
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    
    const productMatch = html.match(/href="(\/products\/rc_[^"]*)"/);
    if (!productMatch) return null;
    
    const productUrl = 'https://torecacamp-pokemon.com' + productMatch[1];
    
    const pRes = await fetch(productUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const pHtml = await pRes.text();
    
    // Try variants first
    const variantsMatch = pHtml.match(/variants":\s*(\[.*?\])[,;]/);
    if (variantsMatch) {
      const variants = JSON.parse(variantsMatch[1]);
      const target = variants.find(v => (v.title || v.public_title)?.includes('A-'))
                  || variants.find(v => (v.title || v.public_title)?.includes('B'))
                  || variants[0];
      
      if (target) {
        const priceJPY = Math.round(target.price / 100);
        const quality = (target.title || target.public_title)?.match(/([AB\-]+)/)?.[1] || 'A';
        return {
          source: 'torecacamp',
          priceJPY,
          priceUSD: Math.round(priceJPY * JPY_TO_USD * 100) / 100,
          quality,
          inStock: target.available !== false,
          url: productUrl + (quality !== 'A' ? `?variant=${target.id}` : ''),
          isLowest: false
        };
      }
    }
    
    // Fallback
    const priceMatch = pHtml.match(/"price":\s*(\d+)/);
    if (priceMatch) {
      const priceJPY = Math.round(parseInt(priceMatch[1]) / 100);
      return {
        source: 'torecacamp',
        priceJPY,
        priceUSD: Math.round(priceJPY * JPY_TO_USD * 100) / 100,
        quality: 'A',
        inStock: !pHtml.includes('Sold Out'),
        url: productUrl,
        isLowest: false
      };
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

async function main() {
  for (let i = 0; i < m2aCards.length; i++) {
    const card = m2aCards[i];
    console.log(`[${i + 1}/${m2aCards.length}] ${card.name} (${card.cardNumber})`);
    
    const prices = [];
    
    // Scrape Japan-Toreca
    console.log('  Searching Japan-Toreca...');
    const jt = await scrapeJapanToreca(card.name);
    if (jt) {
      console.log(`    ✓ ¥${jt.priceJPY} [${jt.quality}] ${jt.inStock ? '✓' : '✗'}`);
      prices.push(jt);
    } else {
      console.log('    ✗ Not found');
    }
    
    await new Promise(r => setTimeout(r, 1500));
    
    // Scrape TorecaCamp
    console.log('  Searching TorecaCamp...');
    const tc = await scrapeTorecaCamp(card.name);
    if (tc) {
      console.log(`    ✓ ¥${tc.priceJPY} [${tc.quality}] ${tc.inStock ? '✓' : '✗'}`);
      prices.push(tc);
    } else {
      console.log('    ✗ Not found');
    }
    
    // Update card
    if (prices.length > 0) {
      const inStock = prices.filter(p => p.inStock);
      const lowest = inStock.length > 0 
        ? inStock.reduce((min, p) => p.priceUSD < min.priceUSD ? p : min)
        : prices[0];
      
      card.japanesePrices = prices.map(p => ({...p, isLowest: p === lowest}));
      card.lowestJapanesePrice = lowest.priceUSD;
      
      // Calculate arbitrage
      if (card.usPrice && card.usPrice.marketPrice > 0) {
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
    
    console.log('');
    await new Promise(r => setTimeout(r, 2000));
  }
  
  // Save
  fs.writeFileSync(pricesPath, JSON.stringify(data, null, 2));
  console.log('✅ Saved updated prices');
}

main().catch(console.error);
