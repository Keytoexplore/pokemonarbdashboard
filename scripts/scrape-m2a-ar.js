const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const JPY_TO_USD = 0.0065;
const pricesPath = path.join(__dirname, '..', 'data', 'prices.json');
const data = JSON.parse(fs.readFileSync(pricesPath, 'utf-8'));

// Get AR cards (201-213)
const arCards = data.opportunities.filter(c => 
  c.set === 'M2a' && c.rarity === 'AR' && c.japanesePrices.length === 0
);

console.log(`Scraping ${arCards.length} M2a AR cards...\n`);

async function scrapeJT(name) {
  const search = name.replace(/'/g, '').split(' ').slice(0, 2).join(' ');
  try {
    const res = await fetch(`https://shop.japan-toreca.com/search?q=m2a+${encodeURIComponent(search)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await res.text();
    if (html.includes('検索結果が見つかりません')) return null;
    
    const match = html.match(/href="(\/products\/pokemon-\d+[^"]*)"/);
    if (!match) return null;
    
    const pRes = await fetch('https://shop.japan-toreca.com' + match[1], {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const pHtml = await pRes.text();
    
    const priceMatch = pHtml.match(/<span[^>]*class="[^"]*price[^"]*"[^>]*>\s*¥\s*([\d,]+)/i);
    if (!priceMatch) return null;
    
    const price = parseInt(priceMatch[1].replace(/,/g, ''));
    const quality = pHtml.match(/【状態([AB\-]+)】/)?.[1] || 'A';
    
    return {
      source: 'japan-toreca',
      priceJPY: price,
      priceUSD: Math.round(price * JPY_TO_USD * 100) / 100,
      quality,
      inStock: !pHtml.includes('売り切れ'),
      url: 'https://shop.japan-toreca.com' + match[1],
      isLowest: false
    };
  } catch (e) { return null; }
}

async function scrapeTC(name) {
  const search = name.replace(/'/g, '').split(' ').slice(0, 2).join(' ');
  try {
    const res = await fetch(`https://torecacamp-pokemon.com/search?q=${encodeURIComponent(search)}+m2a`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await res.text();
    
    const match = html.match(/href="(\/products\/rc_[^"]*)"/);
    if (!match) return null;
    
    const pRes = await fetch('https://torecacamp-pokemon.com' + match[1], {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const pHtml = await pRes.text();
    
    const variants = pHtml.match(/variants":\s*(\[.*?\])[,;]/);
    if (variants) {
      const v = JSON.parse(variants[1]);
      const target = v.find(x => (x.title || x.public_title)?.includes('A-'))
                  || v.find(x => (x.title || x.public_title)?.includes('B'))
                  || v[0];
      
      if (target) {
        const price = Math.round(target.price / 100);
        const q = (target.title || target.public_title)?.match(/([AB\-]+)/)?.[1] || 'A';
        return {
          source: 'torecacamp',
          priceJPY: price,
          priceUSD: Math.round(price * JPY_TO_USD * 100) / 100,
          quality: q,
          inStock: target.available !== false,
          url: 'https://torecacamp-pokemon.com' + match[1] + (q !== 'A' ? `?variant=${target.id}` : ''),
          isLowest: false
        };
      }
    }
    
    const price = pHtml.match(/"price":\s*(\d+)/);
    if (price) {
      const p = Math.round(parseInt(price[1]) / 100);
      return {
        source: 'torecacamp',
        priceJPY: p,
        priceUSD: Math.round(p * JPY_TO_USD * 100) / 100,
        quality: 'A',
        inStock: !pHtml.includes('Sold Out'),
        url: 'https://torecacamp-pokemon.com' + match[1],
        isLowest: false
      };
    }
    return null;
  } catch (e) { return null; }
}

async function main() {
  for (let i = 0; i < Math.min(5, arCards.length); i++) {
    const card = arCards[i];
    console.log(`[${i + 1}] ${card.name} (${card.cardNumber})`);
    
    const prices = [];
    
    const jt = await scrapeJT(card.name);
    if (jt) {
      console.log(`  JT: ¥${jt.priceJPY} [${jt.quality}]`);
      prices.push(jt);
    }
    
    await new Promise(r => setTimeout(r, 1000));
    
    const tc = await scrapeTC(card.name);
    if (tc) {
      console.log(`  TC: ¥${tc.priceJPY} [${tc.quality}]`);
      prices.push(tc);
    }
    
    if (prices.length > 0) {
      const inStock = prices.filter(p => p.inStock);
      const lowest = inStock.length > 0 ? inStock.reduce((m, p) => p.priceUSD < m.priceUSD ? p : m) : prices[0];
      
      card.japanesePrices = prices.map(p => ({...p, isLowest: p === lowest}));
      card.lowestJapanesePrice = lowest.priceUSD;
      
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
    
    console.log('');
    await new Promise(r => setTimeout(r, 1500));
  }
  
  fs.writeFileSync(pricesPath, JSON.stringify(data, null, 2));
  console.log('✅ Saved');
}

main();
