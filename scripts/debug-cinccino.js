#!/usr/bin/env node
/**
 * Debug why Cinccino isn't being found by scraper
 */

const fetch = require('node-fetch');

async function debugSearch() {
  // Search TorecaCamp for Cinccino
  const tcSearchUrl = 'https://torecacamp-pokemon.com/search?type=product&options%5Bprefix%5D=last&options%5Bunavailable_products%5D=last&q=sv11b+ar';
  console.log('=== TorecaCamp Search: sv11b ar ===\n');
  
  const tcRes = await fetch(tcSearchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const tcHtml = await tcRes.text();
  
  const productMatches = [...tcHtml.matchAll(/href="(\/products\/rc_[^"?]*)/g)];
  const uniqueUrls = [...new Set(productMatches.map(m => 'https://torecacamp-pokemon.com' + m[1]))];
  
  console.log(`Found ${uniqueUrls.length} products\n`);
  
  // Check each product for Cinccino
  for (const url of uniqueUrls) {
    const pRes = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const pHtml = await pRes.text();
    
    const titleMatch = pHtml.match(/<title>([\s\S]*?)<\/title>/);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    // Check if this is Cinccino (チラチーノ)
    if (title.includes('チラチーノ') || title.includes('158')) {
      console.log('FOUND CINCCINO!');
      console.log('URL:', url);
      console.log('Title:', title);
      
      // Extract card info
      const cardMatch = title.match(/^(.+?)\s+(AR|SR|SAR)\s+([A-Z0-9]+)\s+(\d+\/\d+)/);
      if (cardMatch) {
        console.log('Parsed:', {
          name: cardMatch[1],
          rarity: cardMatch[2],
          set: cardMatch[3],
          number: cardMatch[4]
        });
      } else {
        console.log('Failed to parse title with regex');
      }
      console.log('');
    }
    
    await new Promise(r => setTimeout(r, 300));
  }
  
  // Now check Japan-Toreca
  console.log('\n=== Japan-Toreca Search: sv11b ar ===\n');
  
  const jtSearchUrl = 'https://shop.japan-toreca.com/search?q=sv11b+ar';
  const jtRes = await fetch(jtSearchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const jtHtml = await jtRes.text();
  
  const jtMatches = [...jtHtml.matchAll(/href="(\/products\/pokemon-\d+[^"]*)"/g)];
  const jtUrls = [...new Set(jtMatches.map(m => 'https://shop.japan-toreca.com' + m[1]))];
  
  console.log(`Found ${jtUrls.length} products\n`);
  
  for (const url of jtUrls.slice(0, 20)) {
    const pRes = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const pHtml = await pRes.text();
    
    const headingMatch = pHtml.match(/<h1[^>]*>(.*?)<\/h1>/);
    const heading = headingMatch ? headingMatch[1] : '';
    
    if (heading.includes('チラチーノ') || heading.includes('158')) {
      console.log('FOUND CINCCINO!');
      console.log('URL:', url);
      console.log('Heading:', heading);
      
      const cardMatch = heading.match(/】\s*(.+?)\s+(AR|SR|SAR)\s*\((\d+\/\d+)\)/);
      if (cardMatch) {
        console.log('Parsed:', {
          name: cardMatch[1],
          rarity: cardMatch[2],
          number: cardMatch[3]
        });
      }
      console.log('');
    }
    
    await new Promise(r => setTimeout(r, 200));
  }
}

debugSearch().catch(console.error);
