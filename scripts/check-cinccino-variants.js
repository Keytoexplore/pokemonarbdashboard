#!/usr/bin/env node
/**
 * Check Cinccino TorecaCamp variants
 */

const fetch = require('node-fetch');

async function checkCinccino() {
  const url = 'https://torecacamp-pokemon.com/products/rc_itch59jttots_prxj';
  console.log('Fetching:', url);
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    }
  });
  const html = await res.text();
  
  // Get variants
  const variantsMatch = html.match(/variants":\s*(\[.*?\])[,;]/);
  if (!variantsMatch) {
    console.log('No variants found');
    return;
  }
  
  const variants = JSON.parse(variantsMatch[1]);
  console.log('\nVariants found:', variants.length);
  
  variants.forEach(v => {
    const title = v.public_title || v.title;
    const price = Math.round(v.price / 100);
    const quality = title.match(/([AB\-]+)/)?.[1] || '?';
    console.log(`  ${title}: ¥${price} (quality: ${quality}, available: ${v.available}, inventory: ${v.inventory_quantity})`);
  });
  
  // Check which variant the scraper would pick
  console.log('\nScraper selection order:');
  const targetA = variants.find(v => (v.title || v.public_title)?.includes('A-'));
  const targetB = variants.find(v => (v.title || v.public_title)?.includes('B'));
  const targetPlainA = variants.find(v => (v.title || v.public_title)?.includes('状態A'));
  
  console.log('  A- found:', targetA ? `${targetA.public_title || targetA.title} (¥${Math.round(targetA.price/100)})` : 'No');
  console.log('  B found:', targetB ? `${targetB.public_title || targetB.title} (¥${Math.round(targetB.price/100)})` : 'No');
  console.log('  Plain A found:', targetPlainA ? `${targetPlainA.public_title || targetPlainA.title} (¥${Math.round(targetPlainA.price/100)})` : 'No');
  
  // Current scraper logic picks:
  const target = variants.find(v => (v.title || v.public_title)?.includes('A-'))
              || variants.find(v => (v.title || v.public_title)?.includes('状態A'))
              || variants.find(v => (v.title || v.public_title)?.includes('B'))
              || variants[0];
  
  console.log('\nScraper would pick:');
  console.log(' ', target ? `${target.public_title || target.title} (¥${Math.round(target.price/100)})` : 'None');
}

checkCinccino().catch(console.error);
