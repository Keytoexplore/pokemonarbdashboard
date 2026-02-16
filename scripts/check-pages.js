#!/usr/bin/env node
/**
 * Check TorecaCamp pagination for more AR cards
 */

const fetch = require('node-fetch');

async function checkPages() {
  for (let page = 1; page <= 5; page++) {
    const url = page === 1 
      ? 'https://torecacamp-pokemon.com/search?type=product&options%5Bprefix%5D=last&options%5Bunavailable_products%5D=last&q=sv11b+ar'
      : `https://torecacamp-pokemon.com/search?type=product&options%5Bprefix%5D=last&options%5Bunavailable_products%5D=last&q=sv11b+ar&page=${page}`;
    
    console.log(`\n=== Page ${page} ===`);
    
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    
    // Check for no results
    if (html.includes('検索結果が見つかりません') || html.includes('No results')) {
      console.log('No more results');
      break;
    }
    
    const productMatches = [...html.matchAll(/href="(\/products\/rc_[^"?]*)/g)];
    const uniqueUrls = [...new Set(productMatches.map(m => 'https://torecacamp-pokemon.com' + m[1]))];
    
    console.log(`Found ${uniqueUrls.length} products`);
    
    // Check for Cinccino on this page
    for (const prodUrl of uniqueUrls) {
      const pRes = await fetch(prodUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const pHtml = await pRes.text();
      
      const titleMatch = pHtml.match(/<title>([\s\S]*?)<\/title>/);
      const title = titleMatch ? titleMatch[1].trim() : '';
      
      if (title.includes('チラチーノ') || title.includes('158')) {
        console.log('*** FOUND CINCCINO ***');
        console.log('URL:', prodUrl);
        console.log('Title:', title);
      }
      
      await new Promise(r => setTimeout(r, 200));
    }
  }
}

checkPages().catch(console.error);
