#!/usr/bin/env node
/**
 * Universal Set Scraper - Works with ANY Japanese set
 * Usage: node scripts/add-set.js <SET_CODE>
 * Example: node scripts/add-set.js M2a
 *          node scripts/add-set.js SV9
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const JPY_TO_USD = 0.0065;
const DELAY_MS = 1000;

const setCode = process.argv[2];

if (!setCode) {
  console.log('Usage: node scripts/add-set.js <SET_CODE>');
  console.log('Examples: M2a, SV9, M3, SV10');
  process.exit(1);
}

// Load config
const pricesPath = path.join(__dirname, '..', 'data', 'prices.json');
const data = JSON.parse(fs.readFileSync(pricesPath, 'utf-8'));
const mappings = require('../lib/set-mappings.ts');

// Get API set ID
function getApiSetId(jpCode) {
  const map = {
    'M1L': 'm1l',
    'M1S': 'm1s',
    'M3': 'm3',
    'M2a': 'm2a',
    'M2': 'm2',
    'SV11B': 'sv11b',
    'SV11W': 'sv11w',
    'SV9': 'sv9',
    'SV10': 'sv10',
    'SV8a': 'terastal-festival-ex',
    'SV8': 'super-electric-breaker',
    'SV7': 'stellar-miracle',
    'SV6a': 'night-wanderer',
    'SV6': 'mask-of-change',
    'SV5': 'wild-force-cyber-judge',
    'SV4a': 'shiny-treasure-ex',
    'SV4': 'ancient-roar-future-flash',
    'SV3': 'ruler-of-the-black-flame',
    'SV2': 'snow-hazard-clay-burst',
    'SV1S': 'scarlet-ex',
    'SV1V': 'violet-ex',
    'S12': 'paradigm-trigger',
  };
  return map[jpCode.toUpperCase()] || jpCode.toLowerCase();
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Step 1: Fetch cards from PokemonPriceTracker API
async function fetchSetFromApi(setCode) {
  const apiSetId = getApiSetId(setCode);
  console.log(`\n📡 Fetching ${setCode} from API (set ID: ${apiSetId})...`);
  
  const API_KEY = process.env.POKEPRICE_API_KEY || 'pokeprice_free_67abf1594acce302cdbaaf1339c9234cbc402f5726e95cd7';
  
  try {
    const res = await fetch(`https://www.pokemonpricetracker.com/api/v2/cards?set=${apiSetId}&language=japanese`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    
    if (!res.ok) {
      console.log(`  ✗ API error: ${res.status}`);
      return null;
    }
    
    const data = await res.json();
    
    // Filter for AR, SR, SAR
    const specialCards = data.data.filter(c => 
      ['Art Rare', 'Super Rare', 'Special Art Rare'].includes(c.rarity)
    );
    
    console.log(`  ✓ Found ${data.data.length} total cards`);
    console.log(`  ✓ ${specialCards.length} AR/SR/SAR cards`);
    
    return specialCards;
  } catch (e) {
    console.log(`  ✗ Error: ${e.message}`);
    return null;
  }
}

// Step 2: Scrape TorecaCamp by set + rarity
async function scrapeTorecaCamp(setCode, rarity) {
  const rarityTerm = rarity === 'AR' ? 'ar' : rarity === 'SR' ? 'sr' : 'sar';
  const searchUrl = `https://torecacamp-pokemon.com/search?type=product&options%5Bprefix%5D=last&options%5Bunavailable_products%5D=last&q=${setCode.toLowerCase()}+${rarityTerm}`;

  console.log(`\n🔍 TorecaCamp: ${setCode} ${rarity}...`);

  try {
    const res = await fetch(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();

    // Extract product URLs
    const productMatches = [...html.matchAll(/href="(\/products\/rc_[^"?]*)/g)];
    const uniqueUrls = [...new Set(productMatches.map(m => 'https://torecacamp-pokemon.com' + m[1]))];

    console.log(`  Found ${uniqueUrls.length} products`);

    const results = [];

    for (const url of uniqueUrls.slice(0, 25)) { // Limit to 25 per rarity
      await delay(800);

      try {
        const pRes = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const pHtml = await pRes.text();

        // Parse title (handle newlines in title tag)
        const titleMatch = pHtml.match(/<title>([\s\S]*?)<\/title>/);
        const title = titleMatch ? titleMatch[1].trim() : '';

        // Extract card info from title
        // Format: "コマタナ AR SV11B 147/086" or "N's Zekrom AR M2a 210/193"
        const cardMatch = title.match(/^(.+?)\s+(AR|SR|SAR)\s+([A-Z0-9]+)\s+(\d+\/\d+)/);
        if (!cardMatch) continue;

        const name = cardMatch[1].trim();
        const cardRarity = cardMatch[2];
        const cardSet = cardMatch[3].toUpperCase();
        const cardNumber = cardMatch[4];

        // CRITICAL: Validate set code matches to prevent cross-contamination
        if (cardSet !== setCode.toUpperCase()) {
          console.log(`    ⚠️ Skipping ${name} - wrong set: ${cardSet} (expected ${setCode.toUpperCase()})`);
          continue;
        }

        // Skip PSA10/graded cards - we only want raw cards
        if (title.includes('PSA10') || title.includes('PSA 10') || title.includes('BGS') || title.includes('CGC')) {
          console.log(`    ⚠️ Skipping graded card: ${title.substring(0, 50)}`);
          continue;
        }

        // Get variants - IMPROVED STOCK DETECTION
        const variantsMatch = pHtml.match(/variants":\s*(\[.*?\])[,;]/);
        if (!variantsMatch) continue;

        const variants = JSON.parse(variantsMatch[1]);

        const target = variants.find(v => (v.title || v.public_title)?.includes('A-'))
                    || variants.find(v => (v.title || v.public_title)?.includes('状態A'))
                    || variants.find(v => (v.title || v.public_title)?.includes('B'))
                    || variants[0];

        if (!target) continue;

        const priceJPY = Math.round(target.price / 100);
        const quality = (target.title || target.public_title)?.match(/([AB\-]+)/)?.[1] || 'A';

        // IMPROVED STOCK CHECK: Use actual UI state, not text search
        // 1. Check variant.available field
        let inStock = target.available !== false && target.available !== 'false';

        // 2. Check inventory_quantity if available
        if (target.inventory_quantity !== undefined) {
          inStock = inStock && target.inventory_quantity > 0;
        }

        // 3. Check if add-to-cart button is disabled (most reliable)
        const addToCartButton = pHtml.match(/<button[^>]*type="submit"[^>]*data-action="add-to-cart"[^>]*>/);
        if (addToCartButton) {
          inStock = !addToCartButton[0].includes('disabled');
        }

        // 4. Fallback: if no price is shown, it's out of stock
        if (!priceJPY || priceJPY === 0) {
          inStock = false;
        }

        results.push({
          name,
          cardNumber,
          rarity: cardRarity,
          source: 'torecacamp',
          priceJPY,
          priceUSD: Math.round(priceJPY * JPY_TO_USD * 100) / 100,
          quality,
          inStock,
          url: url + (quality !== 'A' ? `?variant=${target.id}` : '')
        });

      } catch (e) {}
    }

    return results;
  } catch (e) {
    console.log(`  ✗ Error: ${e.message}`);
    return [];
  }
}

// Step 3: Scrape Japan-Toreca by set + rarity
async function scrapeJapanToreca(setCode, rarity) {
  const rarityTerm = rarity === 'AR' ? 'ar' : rarity === 'SR' ? 'sr' : 'sar';
  const baseSearchUrl = `https://shop.japan-toreca.com/search?q=${setCode.toLowerCase()}+${rarityTerm}`;

  console.log(`\n🔍 Japan-Toreca: ${setCode} ${rarity}...`);

  try {
    // Collect products from all pages
    const allProductUrls = [];
    let page = 1;
    let hasMorePages = true;

    while (hasMorePages && page <= 10) { // Limit to 10 pages max
      const pageUrl = page === 1 ? baseSearchUrl : `${baseSearchUrl}&page=${page}`;
      console.log(`  📄 Fetching page ${page}...`);

      const res = await fetch(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = await res.text();

      if (html.includes('検索結果が見つかりません') || html.includes('検索結果はありません')) {
        console.log('  ✗ No results');
        return [];
      }

      const productMatches = [...html.matchAll(/href="(\/products\/pokemon-\d+[^"]*)"/g)];
      const pageUrls = [...new Set(productMatches.map(m => 'https://shop.japan-toreca.com' + m[1]))];

      if (pageUrls.length === 0) {
        hasMorePages = false;
      } else {
        allProductUrls.push(...pageUrls);

        // Check if there's a next page link
        const hasNextPage = html.includes('pagination__next') ||
                           html.includes('rel="next"') ||
                           html.match(/page=\d+/) && page < 10;

        if (!hasNextPage || pageUrls.length < 5) {
          hasMorePages = false;
        } else {
          page++;
          await delay(1000);
        }
      }
    }

    // Remove duplicates
    const uniqueUrls = [...new Set(allProductUrls)];
    console.log(`  Found ${uniqueUrls.length} products across ${page} page(s)`);

    const results = [];

    // Process all products (up to 50 to avoid timeouts)
    for (const url of uniqueUrls.slice(0, 50)) {
      await delay(600);

      try {
        const pRes = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const pHtml = await pRes.text();

        const headingMatch = pHtml.match(/<h1[^>]*>(.*?)<\/h1>/);
        const heading = headingMatch ? headingMatch[1] : '';

        const cardMatch = heading.match(/】\s*(.+?)\s+(AR|SR|SAR)\s*\((\d+\/\d+)\)/);
        if (!cardMatch) continue;

        const name = cardMatch[1].trim();
        const cardRarity = cardMatch[2];
        const cardNumber = cardMatch[3];

        // CRITICAL: Validate this is the correct card to prevent cross-contamination
        // Parse set code from heading - Japan-Toreca format: "【状態A】Name RAR (number/set) [SETCODE]の通販..."
        const headingSetMatch = heading.match(/\[([A-Z0-9]+)\]の通販/);
        const headingSetCode = headingSetMatch ? headingSetMatch[1].toUpperCase() : null;
        
        if (headingSetCode && headingSetCode !== setCode.toUpperCase()) {
          console.log(`    ⚠️ Skipping ${name} - wrong set in heading: ${headingSetCode} (expected ${setCode.toUpperCase()})`);
          continue;
        }

        const priceMatch = pHtml.match(/<span[^>]*class="[^"]*price[^"]*"[^>]*>\s*¥\s*([\d,]+)/i);
        if (!priceMatch) continue;

        const priceJPY = parseInt(priceMatch[1].replace(/,/g, ''));
        const qualityMatch = heading.match(/【状態([AB\-]+)】/);

        // IMPROVED STOCK DETECTION for Japan-Toreca
        // Priority 1: Check inventory count - this is the most reliable indicator
        // Look for patterns like "在庫数: 3" in the product info section
        const inventoryMatch = pHtml.match(/在庫数[:\s]*([\d]+)/);
        const inventoryCount = inventoryMatch ? parseInt(inventoryMatch[1]) : null;

        // Priority 2: Check for explicit out-of-stock indicators in visible content
        // Look for these patterns in specific contexts (not just anywhere in the HTML)
        const hasExplicitNoStock = pHtml.includes('在庫数: 0') ||
                                   pHtml.includes('在庫数: 売り切れ') ||
                                   pHtml.match(/在庫.*?(売り切れ|売切れ)/);

        // Priority 3: Check if "カートに追加" (Add to Cart) button is present and not disabled
        // Look for the actual button element
        const hasAddToCartButton = pHtml.includes('data-add-to-cart-text="カートに追加"') ||
                                   pHtml.match(/<button[^>]*name="add"[^>]*>.*カートに追加/);
        const isButtonDisabled = pHtml.match(/<button[^>]*name="add"[^>]*disabled[^>]*>/);

        // Priority 4: Check for positive stock indicators
        const hasInStockMessage = pHtml.includes('在庫あり') ||
                                  pHtml.match(/([\d]+)点在庫/); // Pattern like "3点在庫"

        // Determine stock status based on priority
        let inStock = true;

        // If inventory is explicitly 0, it's definitely out of stock
        if (inventoryCount === 0 || hasExplicitNoStock) {
          inStock = false;
        }
        // If we have positive inventory count, it's in stock
        else if (inventoryCount !== null && inventoryCount > 0) {
          inStock = true;
        }
        // If button is disabled, it's out of stock
        else if (isButtonDisabled) {
          inStock = false;
        }
        // If no add to cart button AND no in stock message, likely out of stock
        else if (!hasAddToCartButton && !hasInStockMessage) {
          inStock = false;
        }

        // Fallback: if no price is displayed, it's likely out of stock
        if (!priceJPY || priceJPY === 0) {
          inStock = false;
        }

        results.push({
          name,
          cardNumber,
          rarity: cardRarity,
          source: 'japan-toreca',
          priceJPY,
          priceUSD: Math.round(priceJPY * JPY_TO_USD * 100) / 100,
          quality: qualityMatch ? qualityMatch[1] : 'A',
          inStock,
          url
        });

      } catch (e) {}
    }

    console.log(`  ✓ Scraped ${results.length} prices`);
    return results;
  } catch (e) {
    console.log(`  ✗ Error: ${e.message}`);
    return [];
  }
}

// Main workflow
async function main() {
  console.log('='.repeat(60));
  console.log(`🚀 Adding Set: ${setCode}`);
  console.log('='.repeat(60));
  
  // Step 1: Get API data
  const apiCards = await fetchSetFromApi(setCode);
  if (!apiCards || apiCards.length === 0) {
    console.log('\n❌ Failed to fetch from API. Exiting.');
    process.exit(1);
  }
  
  // Step 2: Scrape Japanese shops
  const japanesePrices = [];
  
  for (const rarity of ['AR', 'SR', 'SAR']) {
    await delay(1000);
    const tc = await scrapeTorecaCamp(setCode, rarity);
    japanesePrices.push(...tc);
    
    await delay(1000);
    const jt = await scrapeJapanToreca(setCode, rarity);
    japanesePrices.push(...jt);
  }
  
  console.log(`\n✅ Scraped ${japanesePrices.length} Japanese prices`);
  
  // Step 3: Create card entries
  const newCards = apiCards.map(apiCard => {
    const rarity = apiCard.rarity === 'Art Rare' ? 'AR' : 
                   apiCard.rarity === 'Super Rare' ? 'SR' : 'SAR';
    
    // Find matching Japanese prices
    const matchingPrices = japanesePrices.filter(p => 
      p.cardNumber === apiCard.cardNumber && p.rarity === rarity
    );
    
    // Find lowest in-stock price
    const inStock = matchingPrices.filter(p => p.inStock);
    const lowest = inStock.length > 0 
      ? inStock.reduce((m, p) => p.priceUSD < m.priceUSD ? p : m)
      : matchingPrices[0];
    
    // Calculate lastKnownPrice for out-of-stock items
    let lastKnownPrice = 0;
    if (inStock.length === 0 && matchingPrices.length > 0) {
      // All out of stock - use the lowest price as lastKnownPrice
      lastKnownPrice = matchingPrices.reduce((m, p) => p.priceUSD < m.priceUSD ? p : m).priceUSD;
    }
    
    const japanPriceUSD = lowest ? lowest.priceUSD : lastKnownPrice;
    const usPrice = apiCard.prices?.market || 0;
    
    // Calculate arbitrage (use lastKnownPrice if current price unavailable)
    let marginPercent = 0;
    let marginAmount = 0;
    let isViable = false;
    
    if (japanPriceUSD > 0 && usPrice > 0) {
      marginAmount = Math.round((usPrice - japanPriceUSD) * 100) / 100;
      marginPercent = Math.round((marginAmount / japanPriceUSD) * 100);
      isViable = marginPercent > 20;
    }
    
    return {
      id: `${setCode}-${apiCard.cardNumber.replace('/', '-')}-${rarity}`,
      name: apiCard.name,
      cardNumber: apiCard.cardNumber,
      rarity,
      set: setCode,
      japanesePrices: matchingPrices.map(p => ({...p, isLowest: p === lowest, lastKnownPrice: !p.inStock ? p.priceUSD : undefined})),
      lowestJapanesePrice: japanPriceUSD,
      usPrice: {
        marketPrice: usPrice,
        sellerCount: apiCard.prices?.sellers || 0,
        listingCount: apiCard.prices?.listings || 0,
        currency: 'USD',
        imageUrl: apiCard.imageUrl,
        imageCdnUrl: apiCard.imageCdnUrl,
        cardName: apiCard.name,
        tcgPlayerUrl: apiCard.tcgPlayerUrl
      },
      arbitrageUS: japanPriceUSD > 0 ? {
        profitAmount: marginAmount,
        profitPercent: marginPercent,
        isViable,
        japanPriceUSD,
        usMarketPrice: usPrice
      } : null,
      marginPercent,
      marginAmount,
      lastUpdated: new Date().toISOString(),
      isViable,
      lastKnownPrice: lastKnownPrice > 0 ? lastKnownPrice : undefined
    };
  });
  
  // Step 4: Add to data
  // Remove existing cards for this set
  data.opportunities = data.opportunities.filter(c => c.set !== setCode);
  
  // Add new cards
  data.opportunities.push(...newCards);
  
  // Update stats
  data.stats.totalCards = data.opportunities.length;
  data.lastUpdated = new Date().toISOString();
  
  // Save
  fs.writeFileSync(pricesPath, JSON.stringify(data, null, 2));
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Set Added Successfully!');
  console.log('='.repeat(60));
  console.log(`Cards added: ${newCards.length}`);
  console.log(`Total cards: ${data.stats.totalCards}`);
  console.log(`Viable opportunities: ${newCards.filter(c => c.isViable).length}`);
  
  // Summary by rarity
  const byRarity = {};
  newCards.forEach(c => {
    if (!byRarity[c.rarity]) byRarity[c.rarity] = { count: 0, viable: 0 };
    byRarity[c.rarity].count++;
    if (c.isViable) byRarity[c.rarity].viable++;
  });
  
  console.log('\nBreakdown:');
  for (const [r, stats] of Object.entries(byRarity)) {
    console.log(`  ${r}: ${stats.count} cards (${stats.viable} viable)`);
  }
  
  console.log('\nNext steps:');
  console.log('  1. Review data/prices.json');
  console.log('  2. Run: npm run build');
  console.log('  3. Commit and push');
}

main().catch(console.error);
