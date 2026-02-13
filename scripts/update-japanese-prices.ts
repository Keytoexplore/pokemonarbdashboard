/**
 * Update Japanese prices by scraping Japan-Toreca and TorecaCamp
 * Usage: npx ts-node scripts/update-japanese-prices.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Simple fetch-based scraper for Japan-Toreca product pages
async function scrapeJapanTorecaProduct(url: string): Promise<{priceJPY: number, quality: string, inStock: boolean} | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) return null;
    
    const html = await response.text();
    
    // Extract price
    const priceMatch = html.match(/¥([\d,]+)/);
    if (!priceMatch) return null;
    const priceJPY = parseInt(priceMatch[1].replace(/,/g, ''));
    
    // Extract quality
    const qualityMatch = html.match(/型番:\s*\d+\/\d+\s*<br>\s*レアリティ:\s*\w+\s*<br>\s*カードタイプ:/);
    const quality = 'A'; // Default, would need better parsing
    
    // Check stock
    const inStock = !html.includes('売り切れ') && !html.includes('在庫数: 0');
    
    return { priceJPY, quality, inStock };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return null;
  }
}

// Update Japanese prices in prices.json
async function updateJapanesePrices() {
  console.log('🔄 Updating Japanese prices...\n');
  
  const pricesPath = path.join(__dirname, '..', 'data', 'prices.json');
  const data = JSON.parse(fs.readFileSync(pricesPath, 'utf-8'));
  
  let updatedCount = 0;
  let errorCount = 0;
  
  for (const card of data.opportunities) {
    console.log(`[${card.set} ${card.cardNumber}] ${card.name}`);
    
    // Update each Japanese price source
    for (let i = 0; i < card.japanesePrices.length; i++) {
      const jp = card.japanesePrices[i];
      
      if (jp.source === 'japan-toreca') {
        console.log(`  🔍 Checking Japan-Toreca...`);
        const fresh = await scrapeJapanTorecaProduct(jp.url);
        
        if (fresh) {
          if (fresh.priceJPY !== jp.priceJPY) {
            console.log(`  ✓ Price changed: ¥${jp.priceJPY} → ¥${fresh.priceJPY}`);
            jp.priceJPY = fresh.priceJPY;
            jp.priceUSD = Math.round(fresh.priceJPY * 0.0065 * 100) / 100;
            updatedCount++;
          } else {
            console.log(`  ✓ Price unchanged: ¥${jp.priceJPY}`);
          }
          jp.inStock = fresh.inStock;
        } else {
          console.log(`  ✗ Failed to scrape`);
          errorCount++;
        }
      }
      
      // Add delay between requests
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  // Save updated data
  fs.writeFileSync(pricesPath, JSON.stringify(data, null, 2));
  
  console.log('\n' + '='.repeat(50));
  console.log('Update complete!');
  console.log('='.repeat(50));
  console.log(`Updated: ${updatedCount} prices`);
  console.log(`Errors: ${errorCount}`);
}

updateJapanesePrices().catch(console.error);
