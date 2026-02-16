#!/usr/bin/env node
/**
 * Debug Genesect ex - PSA10 linking issue
 */

const fetch = require('node-fetch');

async function debugGenesect() {
  // Current URL in data
  const currentUrl = 'https://torecacamp-pokemon.com/products/rc_itcjumsk4p5n_i75o?variant=46976360284334';
  
  console.log('Current URL in database:', currentUrl);
  console.log('\nFetching...\n');
  
  const res = await fetch(currentUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    }
  });
  const html = await res.text();
  
  // Extract title
  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  console.log('Page title:', titleMatch ? titleMatch[1] : 'Not found');
  
  // Extract all product links on page
  const productMatches = [...html.matchAll(/href="(\/products\/rc_[^"?]*)/g)];
  const uniqueUrls = [...new Set(productMatches.map(m => 'https://torecacamp-pokemon.com' + m[1]))];
  
  console.log('\n\nRelated products on this page:');
  uniqueUrls.forEach(url => console.log(' ', url));
  
  // Get variants
  const variantsMatch = html.match(/variants":\s*(\[.*?\])[,;]/);
  if (variantsMatch) {
    const variants = JSON.parse(variantsMatch[1]);
    console.log('\n\nVariants for this product:');
    variants.forEach(v => {
      const title = v.public_title || v.title;
      const price = Math.round(v.price / 100);
      console.log(`  ${title}: ¥${price} (id: ${v.id})`);
    });
  }
  
  // Check if this is the PSA10 page
  if (html.includes('PSA10')) {
    console.log('\n\n⚠️ This page contains PSA10!');
  }
  
  // Now search for the correct non-PSA10 product
  console.log('\n\n=== Searching for correct Genesect product ===');
  const searchUrl = 'https://torecacamp-pokemon.com/search?q=sv11b+sar+172';
  console.log('Search URL:', searchUrl);
  
  const searchRes = await fetch(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    }
  });
  const searchHtml = await searchRes.text();
  
  // Find products
  const searchMatches = [...searchHtml.matchAll(/href="(\/products\/rc_[^"?]*)/g)];
  const searchUrls = [...new Set(searchMatches.map(m => 'https://torecacamp-pokemon.com' + m[1]))];
  
  console.log('\nSearch results:');
  for (const url of searchUrls) {
    console.log(' ', url);
    
    // Quick check if PSA10
    const pRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      }
    });
    const pHtml = await pRes.text();
    
    const pTitle = pHtml.match(/<title>(.*?)<\/title>/);
    if (pTitle) {
      const isPSA10 = pTitle[1].includes('PSA10') || pTitle[1].includes('PSA 10');
      console.log(`    Title: ${pTitle[1]} ${isPSA10 ? '[PSA10]' : '[RAW]'}`);
    }
    
    await new Promise(r => setTimeout(r, 500));
  }
}

debugGenesect().catch(console.error);
