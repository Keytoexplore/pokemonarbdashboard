import * as cheerio from 'cheerio';
import puppeteer, { Browser, Page } from 'puppeteer';

export interface CardData {
  id: string;
  name: string;
  cardNumber: string;
  price: number;
  priceRange?: { min: number; max: number };
  quality: 'A' | 'A-' | 'B' | null;
  availability: 'in_stock' | 'out_of_stock';
  stock: number | null;
  url: string;
  source: 'japan-toreca' | 'torecacamp';
  lastUpdated: string;
  imageUrl?: string;
}

export interface ScraperResult {
  source: 'japan-toreca' | 'torecacamp';
  cards: CardData[];
  scrapedAt: string;
}

class JapanTorecaScraper {
  private browser: Browser | null = null;

  async init() {
    this.browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async scrapeM3Cards(): Promise<CardData[]> {
    if (!this.browser) await this.init();
    
    const page = await this.browser!.newPage();
    
    try {
      console.log('🔍 Scraping Japan-Toreca M3 AR cards...');
      await page.goto('https://shop.japan-toreca.com/search?q=m3+ar', { 
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      const html = await page.content();
      const $ = cheerio.load(html);
      
      const cards: CardData[] = [];
      
      // Parse each product item
      $('a[href*="/products/pokemon-"]').each((index, element) => {
        try {
          const $element = $(element);
          const url = $element.attr('href');
          
          if (!url || url.includes('#')) return;
          
          // Extract card name and quality from heading
          const heading = $element.find('h3').text().trim();
          if (!heading || !heading.includes('M3')) return;
          
          // Parse card info from heading like "【状態A-】ラッタ AR (092/080) [M3]"
          const qualityMatch = heading.match(/【状態([AB\-]+)】/);
          const quality = qualityMatch ? this.parseQuality(qualityMatch[1]) : null;
          
          const nameMatch = heading.match(/】(.+?)\s+AR\s+\((\d+\/\d+)\)/);
          if (!nameMatch) return;
          
          const name = nameMatch[1].trim();
          const cardNumber = nameMatch[2];
          
          // Extract price
          const priceText = $element.find('.product-price, [class*="price"]').first().text().trim();
          const price = this.parsePrice(priceText);
          
          if (!price) return;
          
          // Check stock status
          const stockText = $element.closest('[class*="product"]').text();
          const isOutOfStock = stockText.includes('売り切れ') || stockText.includes('在庫数: 売り切れ');
          const stockMatch = stockText.match(/在庫数:\s*(\d+)/);
          const stock = stockMatch ? parseInt(stockMatch[1]) : (isOutOfStock ? 0 : null);
          
          // Generate ID
          const id = `japan-toreca-${cardNumber}-${quality || 'unknown'}`;
          
          cards.push({
            id,
            name,
            cardNumber,
            price,
            quality,
            availability: isOutOfStock ? 'out_of_stock' : 'in_stock',
            stock,
            url: url.startsWith('http') ? url : `https://shop.japan-toreca.com${url}`,
            source: 'japan-toreca',
            lastUpdated: new Date().toISOString()
          });
        } catch (err) {
          console.error('Error parsing card:', err);
        }
      });
      
      console.log(`✅ Found ${cards.length} cards from Japan-Toreca`);
      await page.close();
      return cards;
    } catch (error) {
      console.error('❌ Error scraping Japan-Toreca:', error);
      await page.close();
      return [];
    }
  }
  
  private parsePrice(priceText: string): number | null {
    const match = priceText.match(/¥?([\d,]+)/);
    if (match) {
      return parseInt(match[1].replace(/,/g, ''));
    }
    return null;
  }
  
  private parseQuality(qualityText: string): 'A' | 'A-' | 'B' | null {
    if (qualityText === 'A-') return 'A-';
    if (qualityText === 'A') return 'A';
    if (qualityText === 'B') return 'B';
    return null;
  }
}

class TorecaCampScraper {
  private browser: Browser | null = null;

  async init() {
    this.browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async scrapeM3Cards(): Promise<CardData[]> {
    if (!this.browser) await this.init();
    
    const page = await this.browser!.newPage();
    
    try {
      console.log('🔍 Scraping TorecaCamp M3 AR cards...');
      await page.goto('https://torecacamp-pokemon.com/search?type=product&options%5Bprefix%5D=last&options%5Bunavailable_products%5D=last&q=m3+ar', { 
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      const html = await page.content();
      const $ = cheerio.load(html);
      
      const cards: CardData[] = [];
      
      // Parse each product card
      $('[class*="product"]').each((index, element) => {
        try {
          const $element = $(element);
          const $link = $element.find('a[href*="/products/"]').first();
          const url = $link.attr('href');
          
          if (!url) return;
          
          // Get card name from link text or heading
          const nameText = $link.text().trim() || $element.find('h3, h2, [class*="title"]').text().trim();
          if (!nameText || !nameText.includes('M3')) return;
          
          // Parse card info like "アマルルガ AR M3 084/080"
          const match = nameText.match(/(.+?)\s+AR\s+M3\s+(\d+\/\d+)/);
          if (!match) return;
          
          const name = match[1].trim();
          const cardNumber = match[2];
          
          // Extract price range
          const priceText = $element.text();
          const priceMatch = priceText.match(/¥([\d,]+)～¥([\d,]+)|¥([\d,]+)/);
          
          let price: number;
          let priceRange: { min: number; max: number } | undefined;
          
          if (priceMatch) {
            if (priceMatch[1] && priceMatch[2]) {
              // Price range
              const min = parseInt(priceMatch[1].replace(/,/g, ''));
              const max = parseInt(priceMatch[2].replace(/,/g, ''));
              price = min; // Use minimum price as the main price
              priceRange = { min, max };
            } else if (priceMatch[3]) {
              // Single price
              price = parseInt(priceMatch[3].replace(/,/g, ''));
            } else {
              return;
            }
          } else {
            return;
          }
          
          // Check stock
          const isOutOfStock = priceText.includes('在庫なし');
          const stockMatch = priceText.match(/在庫\s*(\d+)個/);
          const stock = stockMatch ? parseInt(stockMatch[1]) : (isOutOfStock ? 0 : null);
          
          // Generate ID
          const id = `torecacamp-${cardNumber}`;
          
          cards.push({
            id,
            name,
            cardNumber,
            price,
            priceRange,
            quality: null, // TorecaCamp doesn't separate by quality in listings
            availability: isOutOfStock ? 'out_of_stock' : 'in_stock',
            stock,
            url: url.startsWith('http') ? url : `https://torecacamp-pokemon.com${url}`,
            source: 'torecacamp',
            lastUpdated: new Date().toISOString()
          });
        } catch (err) {
          console.error('Error parsing card:', err);
        }
      });
      
      console.log(`✅ Found ${cards.length} cards from TorecaCamp`);
      await page.close();
      return cards;
    } catch (error) {
      console.error('❌ Error scraping TorecaCamp:', error);
      await page.close();
      return [];
    }
  }
}

// Main scraper function
export async function scrapeM3ARCards(): Promise<ScraperResult[]> {
  const results: ScraperResult[] = [];
  const scrapedAt = new Date().toISOString();
  
  console.log('🚀 Starting M3 AR cards scraping...');
  
  // Scrape Japan-Toreca
  const japanTorecaScraper = new JapanTorecaScraper();
  try {
    await japanTorecaScraper.init();
    const japanTorecaCards = await japanTorecaScraper.scrapeM3Cards();
    results.push({
      source: 'japan-toreca',
      cards: japanTorecaCards,
      scrapedAt
    });
  } catch (error) {
    console.error('Error with Japan-Toreca scraper:', error);
  } finally {
    await japanTorecaScraper.close();
  }
  
  // Scrape TorecaCamp
  const torecaCampScraper = new TorecaCampScraper();
  try {
    await torecaCampScraper.init();
    const torecaCampCards = await torecaCampScraper.scrapeM3Cards();
    results.push({
      source: 'torecacamp',
      cards: torecaCampCards,
      scrapedAt
    });
  } catch (error) {
    console.error('Error with TorecaCamp scraper:', error);
  } finally {
    await torecaCampScraper.close();
  }
  
  console.log('✅ Scraping completed!');
  console.log(`Total sources scraped: ${results.length}`);
  console.log(`Total cards found: ${results.reduce((sum, r) => sum + r.cards.length, 0)}`);
  
  return results;
}

// Scrape specific card URL
export async function scrapeSpecificCard(url: string): Promise<CardData | null> {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    const html = await page.content();
    const $ = cheerio.load(html);
    
    const source = url.includes('japan-toreca.com') ? 'japan-toreca' : 'torecacamp';
    
    // Extract details based on source
    const title = $('h1, .product-title, [class*="product-title"]').first().text().trim();
    const priceText = $('.product-price, [class*="price"]').first().text().trim();
    
    if (!title || !priceText) {
      await browser.close();
      return null;
    }
    
    // Parse card info
    const nameMatch = title.match(/】?(.+?)\s+AR\s+\((\d+\/\d+)\)/);
    if (!nameMatch) {
      await browser.close();
      return null;
    }
    
    const name = nameMatch[1].trim();
    const cardNumber = nameMatch[2];
    
    const priceMatch = priceText.match(/¥([\d,]+)/);
    const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0;
    
    const qualityMatch = title.match(/【状態([AB\-]+)】/);
    const quality = qualityMatch ? (qualityMatch[1] as any) : null;
    
    const pageText = $('body').text();
    const isOutOfStock = pageText.includes('売り切れ') || pageText.includes('在庫なし');
    const stockMatch = pageText.match(/在庫[：:\s]*(\d+)/);
    const stock = stockMatch ? parseInt(stockMatch[1]) : (isOutOfStock ? 0 : null);
    
    await browser.close();
    
    return {
      id: `${source}-${cardNumber}-${quality || 'unknown'}`,
      name,
      cardNumber,
      price,
      quality,
      availability: isOutOfStock ? 'out_of_stock' : 'in_stock',
      stock,
      url,
      source: source as any,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error scraping specific card:', error);
    await browser.close();
    return null;
  }
}
