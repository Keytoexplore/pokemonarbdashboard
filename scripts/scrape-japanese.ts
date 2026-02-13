/**
 * Run Japanese shop scrapers to update prices
 * Usage: npx ts-node scripts/scrape-japanese.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JPY_TO_USD = 0.0065;

interface ScrapedPrice {
  source: 'japan-toreca' | 'torecacamp';
  cardNumber: string;
  priceJPY: number;
  priceUSD: number;
  quality: string | null;
  inStock: boolean;
  url: string;
}

// Scrape a single Japan-Toreca product page
async function scrapeJapanTorecaPage(page: any, url: string): Promise<ScrapedPrice | null> {
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    const html = await page.content();
    const $ = cheerio.load(html);
    
    // Extract price - look for ¥ symbol followed by numbers
    const priceText = $('body').text();
    const priceMatch = priceText.match(/¥([\d,]+)/);
    if (!priceMatch) {
      console.log(`    ⚠ No price found on page`);
      return null;
    }
    const priceJPY = parseInt(priceMatch[1].replace(/,/g, ''));
    
    // Extract card number from URL or page
    const cardNumMatch = url.match(/-(\d+)-a/) || priceText.match(/(\d{3}\/\d{3})/);
    const cardNumber = cardNumMatch ? cardNumMatch[1].replace('-', '/') : 'unknown';
    
    // Check stock status
    const stockText = $('body').text();
    const inStock = !stockText.includes('売り切れ') && !stockText.includes('在庫数: 0');
    
    // Try to extract quality from page
    const qualityMatch = stockText.match(/ランク\s*:\s*([AB\-]+)/i) || stockText.match(/状態.*?(A\-|A|B)/);
    const quality = qualityMatch ? qualityMatch[1] : null;
    
    return {
      source: 'japan-toreca',
      cardNumber,
      priceJPY,
      priceUSD: Math.round(priceJPY * JPY_TO_USD * 100) / 100,
      quality,
      inStock,
      url
    };
  } catch (error) {
    console.error(`    ✗ Error:`, (error as Error).message);
    return null;
  }
}

// Scrape a single TorecaCamp product page  
async function scrapeTorecaCampPage(page: any, url: string): Promise<ScrapedPrice | null> {
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    const html = await page.content();
    const $ = cheerio.load(html);
    
    // Extract price
    const priceEl = $('.price, [class*="price"]').first().text() || $('body').text();
    const priceMatch = priceEl.match(/¥?([\d,]+)/);
    if (!priceMatch) {
      console.log(`    ⚠ No price found`);
      return null;
    }
    const priceJPY = parseInt(priceMatch[1].replace(/,/g, ''));
    
    // Extract card number from page title or content
    const titleText = $('title').text() || $('h1').text();
    const cardNumMatch = titleText.match(/(\d{3}\/\d{3})/);
    const cardNumber = cardNumMatch ? cardNumMatch[1] : 'unknown';
    
    // Check stock
    const stockText = $('body').text().toLowerCase();
    const inStock = !stockText.includes('sold out') && !stockText.includes('out of stock');
    
    // Extract quality
    const qualityMatch = stockText.match(/状態.*?(A\-|A|B)/) || stockText.match(/quality.*?(A\-|A|B)/i);
    const quality = qualityMatch ? qualityMatch[1] : null;
    
    return {
      source: 'torecacamp',
      cardNumber,
      priceJPY,
      priceUSD: Math.round(priceJPY * JPY_TO_USD * 100) / 100,
      quality,
      inStock,
      url
    };
  } catch (error) {
    console.error(`    ✗ Error:`, (error as Error).message);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting Japanese price scraper...\n');
  
  // Load current data
  const pricesPath = path.join(__dirname, '..', 'data', 'prices.json');
  const data = JSON.parse(fs.readFileSync(pricesPath, 'utf-8'));
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  let updatedCount = 0;
  let errorCount = 0;
  
  try {
    for (const card of data.opportunities) {
      console.log(`[${card.set} ${card.cardNumber}] ${card.name}`);
      
      for (let i = 0; i < card.japanesePrices.length; i++) {
        const jp = card.japanesePrices[i];
        console.log(`  🔍 ${jp.source}...`);
        
        let fresh: ScrapedPrice | null = null;
        
        if (jp.source === 'japan-toreca') {
          fresh = await scrapeJapanTorecaPage(page, jp.url);
        } else if (jp.source === 'torecacamp') {
          fresh = await scrapeTorecaCampPage(page, jp.url);
        }
        
        if (fresh) {
          const oldPrice = jp.priceJPY;
          if (fresh.priceJPY !== oldPrice) {
            console.log(`    ✓ Updated: ¥${oldPrice} → ¥${fresh.priceJPY} (${fresh.quality || '?'})`);
            jp.priceJPY = fresh.priceJPY;
            jp.priceUSD = fresh.priceUSD;
            updatedCount++;
          } else {
            console.log(`    ✓ Unchanged: ¥${fresh.priceJPY}`);
          }
          jp.inStock = fresh.inStock;
          if (fresh.quality) jp.quality = fresh.quality;
        } else {
          console.log(`    ✗ Failed`);
          errorCount++;
        }
        
        // Rate limiting
        await new Promise(r => setTimeout(r, 1500));
      }
    }
    
    // Save updated data
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(pricesPath, JSON.stringify(data, null, 2));
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Scraping complete!');
    console.log('='.repeat(50));
    console.log(`Updated prices: ${updatedCount}`);
    console.log(`Errors: ${errorCount}`);
    
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
