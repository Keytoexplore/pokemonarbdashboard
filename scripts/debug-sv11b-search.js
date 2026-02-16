#!/usr/bin/env node
/**
 * Debug SV11B search on Japan-Toreca to understand cross-contamination
 */

const fetch = require('node-fetch');

async function testSearch() {
  const searchUrl = 'https://shop.japan-toreca.com/search?q=sv11b+sar';
  console.log('Testing search:', searchUrl);
  
  const res = await fetch(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  
  // Extract product URLs
  const productMatches = [...html.matchAll(/href="(\/products\/pokemon-\d+[^"]*)"/g)];
  const uniqueUrls = [...new Set(productMatches.map(m => 'https://shop.japan-toreca.com' + m[1]))];
  
  console.log(`Found ${uniqueUrls.length} products\n`);
  
  // Check first few products
  for (const url of uniqueUrls.slice(0, 10)) {
    console.log('URL:', url);
    
    const pRes = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const pHtml = await pRes.text();
    
    const headingMatch = pHtml.match(/<h1[^>]*>(.*?)<\/h1>/);
    const heading = headingMatch ? headingMatch[1] : 'No heading';
    
    // Look for set indicators
    const hasSV11B = pHtml.includes('SV11B') || pHtml.includes('sv11b');
    const hasSV11W = pHtml.includes('SV11W') || pHtml.includes('sv11w');
    
    // Check tags
    const tagMatch = pHtml.match(/"tags":\s*(\[[^\]]*\])/);
    const tags = tagMatch ? tagMatch[1] : 'No tags found';
    
    console.log('  Heading:', heading);
    console.log('  Has SV11B:', hasSV11B);
    console.log('  Has SV11W:', hasSV11W);
    console.log('  Tags:', tags.substring(0, 100));
    console.log('');
    
    await new Promise(r => setTimeout(r, 500));
  }
}

testSearch().catch(console.error);
