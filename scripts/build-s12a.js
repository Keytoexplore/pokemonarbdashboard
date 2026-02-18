#!/usr/bin/env node
/**
 * Build data/prices.json for S12a (VSTAR Universe)
 *
 * Data sources (only):
 * - US sell price + TCGPlayer URL: PokemonPriceTracker API
 * - JP buy price + listing URL: Japan-Toreca (A- and B conditions only)
 *
 * Usage:
 *   node scripts/build-s12a.js
 *   node scripts/build-s12a.js --force   # ignore caches
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const SET_CODE = 'S12a';
const API_SET_ID = 's12a'; // confirmed by live API testing

const ALLOWED_RARITIES = new Set(['AR', 'SAR', 'SR', 'CHR', 'UR', 'SSR', 'RRR']);
const ALLOWED_QUALITIES = new Set(['A-', 'B']);

const JPY_TO_USD = 0.0065;

const API_BASE_URL = 'https://www.pokemonpricetracker.com/api/v2';
const API_KEY = process.env.POKEPRICE_API_KEY || 'pokeprice_free_67abf1594acce302cdbaaf1339c9234cbc402f5726e95cd7';

const workspaceRoot = path.join(__dirname, '..');
const outputPath = path.join(workspaceRoot, 'data', 'prices.json');
const cacheDir = path.join(workspaceRoot, 'data', 'cache');
const cacheApiPath = path.join(cacheDir, `ppt-${API_SET_ID}-cards.json`);
const cacheJTPath = path.join(cacheDir, `japan-toreca-${API_SET_ID}-listings.json`);

const FORCE = process.argv.includes('--force');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeQuality(q) {
  const t = String(q || '').toUpperCase().replace('－', '-');
  if (t === 'A-') return 'A-';
  if (t === 'B') return 'B';
  if (t === 'A') return 'A';
  return null;
}

function parseMoneyJPY(text) {
  const m = text.match(/¥\s*([\d,]+)/);
  if (!m) return null;
  return parseInt(m[1].replace(/,/g, ''), 10);
}

function parseCardInfoFromHeading(heading) {
  // Example: "【状態A-】アルセウスVSTAR UR (262/172) [S12a]"
  const m = heading.match(/】\s*(.+?)\s+(AR|SAR|SR|CHR|UR|SSR|RRR)\s*\((\d+\/\d+)\)/i);
  if (!m) return null;
  return {
    nameJP: m[1].trim(),
    rarity: m[2].toUpperCase(),
    cardNumber: m[3],
  };
}

async function fetchJson(url, { rateLimitMs = 1100 } = {}) {
  // gentle global pacing
  await delay(rateLimitMs);

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} for ${url}: ${body.slice(0, 200)}`);
  }

  return res.json();
}

async function fetchAllCardsFromApi() {
  ensureDir(cacheDir);

  if (!FORCE && fs.existsSync(cacheApiPath)) {
    const cached = JSON.parse(fs.readFileSync(cacheApiPath, 'utf8'));
    if (cached?.data?.length) {
      console.log(`📦 Using cached API set dump: ${path.relative(workspaceRoot, cacheApiPath)}`);
      return cached;
    }
  }

  console.log(`📡 Fetching full set from PokemonPriceTracker API: ${API_SET_ID} (japanese)`);

  const limit = 50;
  let offset = 0;
  let all = [];
  let metadata = null;

  while (true) {
    const params = new URLSearchParams({
      set: API_SET_ID,
      language: 'japanese',
      limit: String(limit),
      offset: String(offset),
    });

    const url = `${API_BASE_URL}/cards?${params.toString()}`;
    const page = await fetchJson(url);

    metadata = page.metadata || metadata;
    const chunk = Array.isArray(page.data) ? page.data : [];
    all.push(...chunk);

    const hasMore = Boolean(page.metadata?.hasMore);
    console.log(`  ✓ API page offset=${offset} count=${chunk.length} hasMore=${hasMore}`);

    if (!hasMore || chunk.length === 0) break;
    offset += limit;
  }

  const out = { data: all, metadata };
  fs.writeFileSync(cacheApiPath, JSON.stringify(out, null, 2));
  console.log(`💾 Wrote API cache: ${path.relative(workspaceRoot, cacheApiPath)} (${all.length} cards)`);
  return out;
}

function mapApiRarityToCode(rarity) {
  const r = String(rarity || '').trim().toLowerCase();
  if (r === 'art rare') return 'AR';
  if (r === 'special art rare') return 'SAR';
  if (r === 'super rare') return 'SR';
  if (r === 'character rare') return 'CHR';
  if (r === 'ultra rare') return 'UR';
  if (r === 'shiny super rare') return 'SSR';
  if (r === 'triple rare') return 'RRR';
  return null;
}

async function scrapeJapanTorecaListings() {
  ensureDir(cacheDir);

  if (!FORCE && fs.existsSync(cacheJTPath)) {
    const cached = JSON.parse(fs.readFileSync(cacheJTPath, 'utf8'));
    if (Array.isArray(cached) && cached.length) {
      console.log(`📦 Using cached Japan-Toreca listings: ${path.relative(workspaceRoot, cacheJTPath)}`);
      return cached;
    }
  }

  console.log(`🛒 Scraping Japan-Toreca search listings for ${SET_CODE} (A-/B only)`);

  const rarities = Array.from(ALLOWED_RARITIES);
  const all = [];
  const seenUrls = new Set();

  for (const rarity of rarities) {
    const base = `https://shop.japan-toreca.com/search?q=${encodeURIComponent(`${SET_CODE.toLowerCase()} ${rarity.toLowerCase()}`)}`;
    let page = 1;

    while (page <= 20) {
      const url = page === 1 ? base : `${base}&page=${page}`;
      console.log(`  📄 ${rarity}: page ${page}`);

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          Accept: 'text/html',
        },
      });

      if (!res.ok) {
        console.warn(`    ⚠ HTTP ${res.status} on ${url}`);
        break;
      }

      const html = await res.text();
      const $ = cheerio.load(html);

      // if the page has no product anchors, stop paging
      const anchors = $('a[href*="/products/pokemon-"]');
      if (anchors.length === 0) break;

      let foundOnPage = 0;

      anchors.each((_, el) => {
        const $a = $(el);
        const href = $a.attr('href');
        if (!href || href.includes('#')) return;

        const heading = $a.find('h3').text().trim() || $a.text().trim();
        if (!heading) return;

        // Ensure this is the right set
        if (!heading.toUpperCase().includes(`[${SET_CODE.toUpperCase()}]`)) return;

        const info = parseCardInfoFromHeading(heading);
        if (!info) return;
        if (!ALLOWED_RARITIES.has(info.rarity)) return;

        const quality = normalizeQuality((heading.match(/【状態([AB\-－]+)】/) || [])[1]);
        if (!ALLOWED_QUALITIES.has(quality)) return;

        const priceText = $a.find('.product-price, [class*="price"]').first().text().trim() || $a.text();
        const priceJPY = parseMoneyJPY(priceText);
        if (!priceJPY) return;

        const containerText = $a.closest('[class*="product"], li, div').text();
        const inStock = !(containerText.includes('売り切れ') || containerText.includes('在庫数: 売り切れ'));

        const absUrl = href.startsWith('http') ? href : `https://shop.japan-toreca.com${href}`;
        if (seenUrls.has(absUrl)) return;
        seenUrls.add(absUrl);

        all.push({
          source: 'japan-toreca',
          name: info.nameJP,
          cardNumber: info.cardNumber,
          rarity: info.rarity,
          quality,
          priceJPY,
          priceUSD: Math.round(priceJPY * JPY_TO_USD * 100) / 100,
          inStock,
          url: absUrl,
          scrapedAt: new Date().toISOString(),
        });

        foundOnPage++;
      });

      if (foundOnPage === 0) break;
      page++;
      await delay(700);
    }
  }

  fs.writeFileSync(cacheJTPath, JSON.stringify(all, null, 2));
  console.log(`💾 Wrote Japan-Toreca cache: ${path.relative(workspaceRoot, cacheJTPath)} (${all.length} listings)`);
  return all;
}

function pickLowestPrice(prices) {
  if (!prices.length) return null;
  return prices.reduce((min, p) => (p.priceUSD < min.priceUSD ? p : min));
}

function uniqBestByQuality(prices) {
  // keep best (lowest in-stock, else lowest) per quality
  const byQ = new Map();

  for (const q of ['A-', 'B']) {
    const candidates = prices.filter((p) => p.quality === q);
    if (!candidates.length) continue;

    const inStock = candidates.filter((p) => p.inStock);
    const best = pickLowestPrice(inStock.length ? inStock : candidates);
    if (best) byQ.set(q, best);
  }

  return Array.from(byQ.values()).sort((a, b) => a.priceUSD - b.priceUSD);
}

function computeArbitrage(japanPriceUSD, usMarketPrice, { isPotential = false } = {}) {
  const profitAmount = usMarketPrice - japanPriceUSD;
  const profitPercent = japanPriceUSD > 0 ? (profitAmount / japanPriceUSD) * 100 : 0;

  const roundedAmount = Math.round(profitAmount * 100) / 100;
  const roundedPercent = Math.round(profitPercent * 10) / 10;

  // Basic viability: keep same behavior as prior dashboard, but require both prices
  const isViable = japanPriceUSD > 0 && usMarketPrice > 0 && roundedPercent > 20;

  return {
    profitAmount: roundedAmount,
    profitPercent: roundedPercent,
    japanPriceUSD,
    usMarketPrice,
    isViable,
    isPotential: isPotential || undefined,
  };
}

async function main() {
  console.log('='.repeat(70));
  console.log(`🏗️  Build dataset: ${SET_CODE}`);
  console.log('='.repeat(70));

  const apiDump = await fetchAllCardsFromApi();
  const jtListings = await scrapeJapanTorecaListings();

  // Filter API cards by rarity (API returns full rarity names like "Ultra Rare")
  const apiCards = (apiDump.data || [])
    .map((c) => ({ ...c, rarityCode: mapApiRarityToCode(c.rarity) }))
    .filter((c) => c.rarityCode && ALLOWED_RARITIES.has(c.rarityCode));
  console.log(`🎯 Filtered API cards: ${apiCards.length} special rarities`);

  const opportunities = [];

  for (const c of apiCards) {
    const rarity = c.rarityCode;
    const cardNumber = String(c.cardNumber || '');

    const jpMatches = jtListings.filter((p) => p.cardNumber === cardNumber && p.rarity === rarity);
    const jpBest = uniqBestByQuality(jpMatches);

    const lowestInStock = pickLowestPrice(jpBest.filter((p) => p.inStock));
    const lowestAny = pickLowestPrice(jpBest);

    const useJP = lowestInStock || lowestAny;
    const japanPriceUSD = useJP ? useJP.priceUSD : 0;

    const usMarket = c.prices?.market || 0;

    const arbitrageUS = japanPriceUSD > 0 && usMarket > 0
      ? computeArbitrage(japanPriceUSD, usMarket, { isPotential: !lowestInStock && Boolean(lowestAny) })
      : null;

    const marginPercent = arbitrageUS ? arbitrageUS.profitPercent : 0;
    const marginAmount = arbitrageUS ? arbitrageUS.profitAmount : 0;

    opportunities.push({
      id: `${SET_CODE}-${cardNumber}-${rarity}`,
      name: c.name,
      cardNumber,
      rarity,
      set: SET_CODE,
      japanesePrices: jpBest.map((p) => ({
        source: 'japan-toreca',
        priceJPY: p.priceJPY,
        priceUSD: p.priceUSD,
        quality: p.quality,
        inStock: p.inStock,
        url: p.url,
        isLowest: useJP ? p.url === useJP.url : false,
      })),
      lowestJapanesePrice: japanPriceUSD,
      usPrice: {
        marketPrice: usMarket,
        sellerCount: c.prices?.sellers || 0,
        listingCount: c.prices?.listings || 0,
        currency: 'USD',
        imageUrl: c.imageUrl,
        imageCdnUrl: c.imageCdnUrl,
        cardName: c.name,
        tcgPlayerUrl: c.tcgPlayerUrl,
      },
      tcgplayer: {
        marketPrice: usMarket,
        sellerCount: c.prices?.sellers || 0,
      },
      arbitrageUS,
      marginPercent,
      marginAmount,
      lastUpdated: new Date().toISOString(),
      isViable: Boolean(arbitrageUS?.isViable),
      imageUrl: c.imageCdnUrl || c.imageUrl,
      lastKnownPrice: !lowestInStock && lowestAny ? {
        priceJPY: lowestAny.priceJPY,
        priceUSD: lowestAny.priceUSD,
        quality: lowestAny.quality,
        date: new Date().toISOString(),
        inStock: false,
        source: 'japan-toreca',
        url: lowestAny.url,
      } : null,
    });
  }

  // Sort by margin % desc, then by US market price desc
  opportunities.sort((a, b) => (b.marginPercent - a.marginPercent) || ((b.usPrice?.marketPrice || 0) - (a.usPrice?.marketPrice || 0)));

  const viableCount = opportunities.filter((c) => c.isViable).length;
  const avgMargin = opportunities.length
    ? Math.round((opportunities.reduce((s, c) => s + (c.marginPercent || 0), 0) / opportunities.length) * 10) / 10
    : 0;

  const out = {
    opportunities,
    lastUpdated: new Date().toISOString(),
    stats: {
      totalCards: opportunities.length,
      viableOpportunities: viableCount,
      avgMargin,
    },
  };

  fs.writeFileSync(outputPath, JSON.stringify(out, null, 2));
  console.log(`\n✅ Wrote ${path.relative(workspaceRoot, outputPath)} with ${opportunities.length} cards`);
  console.log(`   Viable: ${viableCount}`);
  console.log(`   Avg margin: ${avgMargin}%`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
