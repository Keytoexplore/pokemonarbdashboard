import * as cheerio from 'cheerio';

export type JapanTorecaQuality = 'A-' | 'B' | 'A' | null;

export interface JapanTorecaCardListing {
  name: string;
  cardNumber: string; // e.g. "262/172"
  rarity: string; // e.g. "SAR"
  priceJPY: number;
  quality: JapanTorecaQuality;
  inStock: boolean;
  url: string;
  source: 'japan-toreca';
  scrapedAt: string;
}

function parsePriceJPY(text: string): number | null {
  const match = text.match(/¥\s*([\d,]+)/);
  if (!match) return null;
  return parseInt(match[1].replace(/,/g, ''), 10);
}

function parseQuality(text: string): JapanTorecaQuality {
  const m = text.match(/【状態([AB\-－]+)】/);
  if (!m) return null;
  const q = m[1].toUpperCase().replace('－', '-');
  if (q === 'A-') return 'A-';
  if (q === 'A') return 'A';
  if (q === 'B') return 'B';
  return null;
}

function parseCardInfo(text: string): { name: string; rarity: string; cardNumber: string } | null {
  // Example: "【状態A-】アルセウスVSTAR UR (262/172) [S12a]"
  const m = text.match(/】\s*(.+?)\s+(AR|SAR|SR|CHR|UR|SSR|RRR)\s*\((\d+\/\d+)\)/i);
  if (!m) return null;
  return {
    name: m[1].trim(),
    rarity: m[2].toUpperCase(),
    cardNumber: m[3],
  };
}

/**
 * Scrape a Japan-Toreca search results page (server-rendered HTML).
 * This avoids visiting individual product pages to keep requests minimal.
 */
export async function scrapeJapanTorecaSearchPage(url: string): Promise<JapanTorecaCardListing[]> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      Accept: 'text/html',
    },
  });

  if (!res.ok) {
    throw new Error(`Japan-Toreca fetch failed: ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  const scrapedAt = new Date().toISOString();
  const out: JapanTorecaCardListing[] = [];

  $('a[href*="/products/pokemon-"]').each((_, el) => {
    const $a = $(el);
    const href = $a.attr('href');
    if (!href || href.includes('#')) return;

    const heading = $a.find('h3').text().trim() || $a.text().trim();
    const info = parseCardInfo(heading);
    if (!info) return;

    const quality = parseQuality(heading);
    const priceText = $a.find('.product-price, [class*="price"]').first().text().trim() || $a.text();
    const priceJPY = parsePriceJPY(priceText);
    if (!priceJPY) return;

    const containerText = $a.closest('[class*="product"], li, div').text();
    const inStock = !(containerText.includes('売り切れ') || containerText.includes('在庫数: 売り切れ'));

    out.push({
      name: info.name,
      rarity: info.rarity,
      cardNumber: info.cardNumber,
      priceJPY,
      quality,
      inStock,
      url: href.startsWith('http') ? href : `https://shop.japan-toreca.com${href}`,
      source: 'japan-toreca',
      scrapedAt,
    });
  });

  return out;
}
