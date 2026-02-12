import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

const JPY_TO_USD = 0.0065;

export interface ScrapedCard {
  name: string;
  cardNumber: string;
  set: string;
  priceJPY: number;
  priceUSD: number;
  quality?: 'A' | 'A-' | 'B' | null;
  inStock: boolean;
  url: string;
  source: 'japan-toreca' | 'torecacamp';
}

function detectRarity(cardNumber: string): 'SR' | 'AR' | 'SAR' | null {
  const [current, total] = cardNumber.split('/').map(Number);
  
  if (current > 100 && total === 80) return 'SAR';
  if (current > 80 && total === 80) return 'AR';
  if (current <= 80 && total === 80) return 'SR';
  
  return null;
}

export async function scrapeJapanTorecaForSet(set: string): Promise<ScrapedCard[]> {
  console.log(`🔍 Scraping Japan-Toreca for set: ${set}...`);
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    const cards: ScrapedCard[] = [];
    
    // Search for SR, AR, SAR cards for this set
    const searchTerms = ['SR', 'AR', 'SAR'];
    
    for (const term of searchTerms) {
      const searchUrl = `https://shop.japan-toreca.com/search?q=${set}+${term}`;
      console.log(`  Searching: ${searchUrl}`);
      
      await page.goto(searchUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      const html = await page.content();
      const $ = cheerio.load(html);
      
      $('a[href*="/products/"]').each((_, element) => {
        const $el = $(element);
        const url = $el.attr('href');
        if (!url || url.includes('#') || !url.includes('pokemon')) return;
        
        const heading = $el.find('h3').text().trim();
        if (!heading) return;
        
        // Parse quality
        const qualityMatch = heading.match(/【状態([AB\-]+)】/);
        const quality = qualityMatch ? qualityMatch[1] as 'A' | 'A-' | 'B' : null;
        
        // Parse name and card number
        const nameMatch = heading.match(/】(.+?)(?:\s+(SR|AR|SAR))?\s*\((\d+\/\d+)\)/);
        if (!nameMatch) return;
        
        const name = nameMatch[1].trim();
        const rarity = nameMatch[2] || '';
        const cardNumber = nameMatch[3];
        
        // Only keep SR, AR, SAR cards
        const detectedRarity = detectRarity(rarity || name, cardNumber);
        if (!detectedRarity) return;
        
        const priceText = $el.find('.product-price, [class*="price"]').first().text();
        const priceMatch = priceText.match(/¥?([\d,]+)/);
        if (!priceMatch) return;
        
        const priceJPY = parseInt(priceMatch[1].replace(/,/g, ''));
        const priceUSD = Math.round(priceJPY * JPY_TO_USD * 100) / 100;
        
        const stockText = $el.closest('[class*="product"]').text();
        const inStock = !stockText.includes('売り切れ');
        
        cards.push({
          name,
          cardNumber,
          set,
          priceJPY,
          priceUSD,
          quality,
          inStock,
          url: url.startsWith('http') ? url : `https://shop.japan-toreca.com${url}`,
          source: 'japan-toreca'
        });
      });
    }
    
    console.log(`✅ Found ${cards.length} cards from Japan-Toreca for ${set}`);
    return cards;
  } finally {
    await browser.close();
  }
}

export async function scrapeTorecaCampForSet(set: string): Promise<ScrapedCard[]> {
  console.log(`🔍 Scraping TorecaCamp for set: ${set}...`);
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    const cards: ScrapedCard[] = [];
    
    const searchTerms = ['SR', 'AR', 'SAR'];
    
    for (const term of searchTerms) {
      const searchUrl = `https://torecacamp-pokemon.com/search?q=${set}+${term}`;
      console.log(`  Searching: ${searchUrl}`);
      
      await page.goto(searchUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      const html = await page.content();
      const $ = cheerio.load(html);
      
      $('[class*="product"]').each((_, element) => {
        const $el = $(element);
        const $link = $el.find('a[href*="/products/"]').first();
        const url = $link.attr('href');
        if (!url) return;
        
        const nameText = $link.text().trim() || $el.find('h3, h2, [class*="title"]').text().trim();
        if (!nameText) return;
        
        // Parse: アマルルガ AR M3 084/080
        const match = nameText.match(/(.+?)\s+(SR|AR|SAR)(?:\s+${set})?\s*(\d+\/\d+)/);
        if (!match) return;
        
        const name = match[1].trim();
        const rarity = match[2];
        const cardNumber = match[3];
        
        const priceText = $el.text();
        const priceMatch = priceText.match(/¥([\d,]+)/);
        if (!priceMatch) return;
        
        const priceJPY = parseInt(priceMatch[1].replace(/,/g, ''));
        const priceUSD = Math.round(priceJPY * JPY_TO_USD * 100) / 100;
        
        const inStock = !priceText.includes('在庫なし');
        
        cards.push({
          name,
          cardNumber,
          set,
          priceJPY,
          priceUSD,
          quality: null,
          inStock,
          url: url.startsWith('http') ? url : `https://torecacamp-pokemon.com${url}`,
          source: 'torecacamp'
        });
      });
    }
    
    console.log(`✅ Found ${cards.length} cards from TorecaCamp for ${set}`);
    return cards;
  } finally {
    await browser.close();
  }
}

// Scrape all configured sets
export async function scrapeAllSets(sets: string[]): Promise<ScrapedCard[]> {
  const allCards: ScrapedCard[] = [];
  
  for (const set of sets) {
    console.log(`\n🎴 Processing set: ${set}`);
    
    const [japanTorecaCards, torecaCampCards] = await Promise.all([
      scrapeJapanTorecaForSet(set),
      scrapeTorecaCampForSet(set)
    ]);
    
    allCards.push(...japanTorecaCards, ...torecaCampCards);
  }
  
  console.log(`\n📊 Total cards scraped: ${allCards.length}`);
  return allCards;
}