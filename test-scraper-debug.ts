#!/usr/bin/env tsx
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

const JPY_TO_USD = 0.0065;

function detectRarity(rarityText: string, cardNumber: string): 'SR' | 'AR' | 'SAR' | null {
  if (rarityText === 'SAR') return 'SAR';
  if (rarityText === 'AR') return 'AR';
  if (rarityText === 'SR') return 'SR';
  
  const [current, total] = cardNumber.split('/').map(Number);
  if (current > 100 && total === 80) return 'SAR';
  if (current > 80 && total === 80) return 'AR';
  if (current <= 80 && total === 80) return 'SR';
  
  return null;
}

async function testScraper() {
  console.log('Testing full scraper logic...\n');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    const cards: any[] = [];
    
    const searchTerms = ['SR', 'AR', 'SAR'];
    
    for (const term of searchTerms) {
      const searchUrl = `https://shop.japan-toreca.com/search?q=M3+${term}`;
      console.log(`Searching: ${searchUrl}`);
      
      await page.goto(searchUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      const html = await page.content();
      const $ = cheerio.load(html);
      
      console.log(`  Page HTML length: ${html.length}`);
      
      let productCount = 0;
      $('a[href*="/products/"]').each((_, element) => {
        productCount++;
        const $el = $(element);
        const url = $el.attr('href');
        
        if (!url || url.includes('#') || !url.includes('pokemon')) return;
        
        const heading = $el.find('h3').text().trim();
        if (!heading) return;
        
        console.log(`  Product ${productCount}: ${heading}`);
        
        // Parse quality
        const qualityMatch = heading.match(/【状態([AB\-]+)】/);
        const quality = qualityMatch ? qualityMatch[1] as 'A' | 'A-' | 'B' : null;
        
        // Parse name and card number
        const nameMatch = heading.match(/】(.+?)(?:\s+(SR|AR|SAR))?\s*\((\d+\/\d+)\)/);
        if (!nameMatch) {
          console.log(`    ❌ No name match for: ${heading}`);
          return;
        }
        
        const name = nameMatch[1].trim();
        const rarity = nameMatch[2] || '';
        const cardNumber = nameMatch[3];
        
        console.log(`    ✅ Name: ${name}, Rarity: ${rarity}, Number: ${cardNumber}`);
        
        // Only keep SR, AR, SAR cards
        const detectedRarity = detectRarity(rarity || name, cardNumber);
        if (!detectedRarity) {
          console.log(`    ❌ Not SR/AR/SAR`);
          return;
        }
        
        console.log(`    ✅ Detected rarity: ${detectedRarity}`);
        
        const priceText = $el.find('.product-price, [class*="price"]').first().text();
        const priceMatch = priceText.match(/¥?([\d,]+)/);
        if (!priceMatch) {
          console.log(`    ❌ No price found: ${priceText}`);
          return;
        }
        
        const priceJPY = parseInt(priceMatch[1].replace(/,/g, ''));
        const priceUSD = Math.round(priceJPY * JPY_TO_USD * 100) / 100;
        
        console.log(`    ✅ Price: ¥${priceJPY}`);
        
        const stockText = $el.closest('[class*="product"]').text();
        const inStock = !stockText.includes('売り切れ');
        
        cards.push({
          name,
          cardNumber,
          set: 'M3',
          priceJPY,
          priceUSD,
          quality,
          inStock,
          url: url.startsWith('http') ? url : `https://shop.japan-toreca.com${url}`,
          source: 'japan-toreca'
        });
        
        console.log(`    ✅ Card added!`);
      });
      
      console.log(`  Total products checked: ${productCount}`);
      console.log(`  Cards found: ${cards.length}`);
      console.log('');
    }
    
    console.log(`\n✅ Total cards: ${cards.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testScraper();