#!/usr/bin/env tsx
/**
 * Master Data Integration Script
 * 
 * This script orchestrates the entire data pipeline:
 * 1. Scrape Japanese sites (Japan-Toreca, TorecaCamp)
 * 2. Match cards with English names
 * 3. Fetch TCGPlayer prices
 * 4. Calculate arbitrage opportunities
 * 5. Generate dashboard data
 */

import { scrapeAllSets } from './src/lib/scraper';
import { getTCGPlayerPrice, getCacheStats } from './src/lib/tcgplayer-api';
import { getCardMapping } from './src/lib/card-mappings';
import { ArbitrageOpportunity, DashboardData } from './src/lib/types';
import * as fs from 'fs';
import * as path from 'path';

const JPY_TO_USD = 0.0065;

// Configuration
const CONFIG = {
  sets: ['M3'],
  minMarginPercent: 20,
  outputFile: path.join(process.cwd(), 'data', 'arbitrage-data.json'),
  rawDataFile: path.join(process.cwd(), 'data', 'scraped-raw.json'),
  useTCGPlayer: true // Try to use TCGPlayer when English names are available
};

function detectRarity(cardNumber: string): 'SR' | 'AR' | 'SAR' {
  const [current, total] = cardNumber.split('/').map(Number);
  
  if (current > 100 && total === 80) return 'SAR';
  if (current > 80 && total === 80) return 'AR';
  return 'SR';
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${title}`);
  console.log('='.repeat(60));
}

async function runIntegration(): Promise<DashboardData> {
  logSection('POKEMON ARBITRAGE DATA INTEGRATION');
  console.log(`Sets: ${CONFIG.sets.join(', ')}`);
  console.log(`Started: ${new Date().toLocaleString()}`);
  
  // Step 1: Scrape Japanese sites
  logSection('STEP 1: Scraping Japanese Sites');
  const scrapedCards = await scrapeAllSets(CONFIG.sets);
  
  if (scrapedCards.length === 0) {
    console.error('❌ CRITICAL: No cards scraped! Check scraper functionality.');
    // Return empty data but don't crash
    return {
      opportunities: [],
      lastUpdated: new Date().toISOString(),
      stats: { totalCards: 0, viableOpportunities: 0, avgMargin: 0 }
    };
  }
  
  console.log(`✅ Scraped ${scrapedCards.length} cards total`);
  
  // Save raw data for debugging
  fs.writeFileSync(CONFIG.rawDataFile, JSON.stringify(scrapedCards, null, 2));
  console.log(`💾 Raw data saved to: ${CONFIG.rawDataFile}`);
  
  // Step 2: Group and process cards
  logSection('STEP 2: Processing Card Data');
  
  const cardGroups = new Map<string, {
    japaneseName: string;
    englishName: string | null;
    cardNumber: string;
    set: string;
    rarity: 'SR' | 'AR' | 'SAR';
    japanesePrices: Array<{
      source: 'japan-toreca' | 'torecacamp';
      priceJPY: number;
      priceUSD: number;
      quality?: 'A' | 'A-' | 'B' | null;
      inStock: boolean;
      url: string;
    }>;
  }>();
  
  for (const card of scrapedCards) {
    const key = `${card.set}-${card.cardNumber}`;
    
    if (!cardGroups.has(key)) {
      const mapping = getCardMapping(card.cardNumber, card.set);
      
      cardGroups.set(key, {
        japaneseName: card.name,
        englishName: mapping?.englishName || null,
        cardNumber: card.cardNumber,
        set: card.set,
        rarity: detectRarity(card.cardNumber),
        japanesePrices: []
      });
    }
    
    cardGroups.get(key)!.japanesePrices.push({
      source: card.source,
      priceJPY: card.priceJPY,
      priceUSD: card.priceUSD,
      quality: card.quality,
      inStock: card.inStock,
      url: card.url
    });
  }
  
  console.log(`✅ Grouped into ${cardGroups.size} unique cards`);
  
  // Step 3: Fetch TCGPlayer prices and calculate arbitrage
  logSection('STEP 3: Fetching TCGPlayer Prices');
  
  const cacheStats = getCacheStats();
  console.log(`Cache status: ${cacheStats.entries} entries, oldest: ${cacheStats.oldestEntry?.toLocaleDateString() || 'N/A'}`);
  
  const opportunities: ArbitrageOpportunity[] = [];
  let processedCount = 0;
  let tcgPlayerSuccess = 0;
  
  for (const [key, cardData] of cardGroups) {
    processedCount++;
    
    // Only process in-stock cards
    const inStockPrices = cardData.japanesePrices.filter(p => p.inStock);
    if (inStockPrices.length === 0) continue;
    
    const lowestJapanese = inStockPrices.reduce((min, p) => 
      p.priceUSD < min.priceUSD ? p : min
    );
    
    // Mark lowest price
    const markedPrices = cardData.japanesePrices.map(p => ({
      ...p,
      isLowest: p.source === lowestJapanese.source && p.priceUSD === lowestJapanese.priceUSD
    }));
    
    // Try to get TCGPlayer price
    let tcgplayerData = { marketPrice: 0, sellerCount: 0, listingCount: 0 };
    let marginPercent = 0;
    let marginAmount = 0;
    
    if (CONFIG.useTCGPlayer && cardData.englishName) {
      process.stdout.write(`[${processedCount}/${cardGroups.size}] ${cardData.englishName}... `);
      
      const priceData = await getTCGPlayerPrice(
        cardData.englishName,
        cardData.cardNumber,
        cardData.rarity
      );
      
      if (priceData && priceData.marketPrice > 0) {
        tcgplayerData = priceData;
        marginAmount = priceData.marketPrice - lowestJapanese.priceUSD;
        marginPercent = Math.round((marginAmount / lowestJapanese.priceUSD) * 100);
        tcgPlayerSuccess++;
        console.log(`✅ $${priceData.marketPrice}`);
      } else {
        console.log(`⚠️ No price`);
      }
    }
    
    const isViable = marginPercent >= CONFIG.minMarginPercent;
    
    opportunities.push({
      id: `${cardData.set}-${cardData.cardNumber}-${cardData.rarity}`,
      name: cardData.japaneseName,
      cardNumber: cardData.cardNumber,
      rarity: cardData.rarity,
      set: cardData.set,
      tcgplayer: tcgplayerData,
      japanesePrices: markedPrices,
      lowestJapanesePrice: lowestJapanese.priceUSD,
      marginPercent,
      marginAmount: Math.round(marginAmount * 100) / 100,
      lastUpdated: new Date().toISOString(),
      isViable
    });
  }
  
  console.log(`\n✅ TCGPlayer prices found for ${tcgPlayerSuccess}/${opportunities.length} cards`);
  
  // Step 4: Sort and prepare final data
  logSection('STEP 4: Preparing Dashboard Data');
  
  // Sort by margin (highest first)
  opportunities.sort((a, b) => b.marginPercent - a.marginPercent);
  
  const viableOpportunities = opportunities.filter(o => o.isViable);
  const avgMargin = viableOpportunities.length > 0
    ? Math.round(viableOpportunities.reduce((sum, o) => sum + o.marginPercent, 0) / viableOpportunities.length)
    : 0;
  
  const dashboardData: DashboardData = {
    opportunities,
    lastUpdated: new Date().toISOString(),
    stats: {
      totalCards: opportunities.length,
      viableOpportunities: viableOpportunities.length,
      avgMargin
    }
  };
  
  // Step 5: Save data
  logSection('STEP 5: Saving Data');
  
  const dataDir = path.dirname(CONFIG.outputFile);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  fs.writeFileSync(CONFIG.outputFile, JSON.stringify(dashboardData, null, 2));
  console.log(`💾 Dashboard data saved to: ${CONFIG.outputFile}`);
  
  // Summary
  logSection('INTEGRATION COMPLETE');
  console.log(`Total cards: ${opportunities.length}`);
  console.log(`With TCGPlayer data: ${tcgPlayerSuccess}`);
  console.log(`Viable opportunities (>${CONFIG.minMarginPercent}%): ${viableOpportunities.length}`);
  console.log(`Average margin: ${avgMargin}%`);
  
  if (opportunities.length > 0) {
    console.log('\n🏆 Top 5 Opportunities:');
    opportunities.slice(0, 5).forEach((opp, i) => {
      const profit = opp.tcgplayer.marketPrice > 0 
        ? `(+$${opp.marginAmount.toFixed(2)})` 
        : '(no TCGPlayer data)';
      console.log(`  ${i + 1}. ${opp.name} - ${opp.marginPercent}% margin ${profit}`);
    });
  }
  
  console.log(`\nCompleted: ${new Date().toLocaleString()}`);
  
  return dashboardData;
}

// Run if called directly
if (require.main === module) {
  runIntegration().catch(error => {
    console.error('\n❌ FATAL ERROR:', error);
    process.exit(1);
  });
}

export { runIntegration, CONFIG };