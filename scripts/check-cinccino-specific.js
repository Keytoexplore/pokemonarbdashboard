#!/usr/bin/env node
/**
 * Check specific Cinccino URLs
 */

const fetch = require('node-fetch');

async function checkSpecific() {
  // TorecaCamp URL
  console.log('=== TorecaCamp ===');
  const tcRes = await fetch('https://torecacamp-pokemon.com/products/rc_itch59jttots_prxj', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const tcHtml = await tcRes.text();
  
  const tcTitle = tcHtml.match(/<title>([\s\S]*?)<\/title>/);
  console.log('Title:', tcTitle ? tcTitle[1].trim() : 'Not found');
  
  // Check set code
  const hasSV11B = tcHtml.includes('SV11B');
  console.log('Has SV11B:', hasSV11B);
  
  // Parse with scraper regex
  const cardMatch = tcTitle[1].match(/^(.+?)\s+(AR|SR|SAR)\s+([A-Z0-9]+)\s+(\d+\/\d+)/);
  console.log('Regex match:', cardMatch ? {
    name: cardMatch[1],
    rarity: cardMatch[2], 
    set: cardMatch[3],
    number: cardMatch[4]
  } : 'No match');
  
  console.log('\n=== Japan-Toreca ===');
  const jtRes = await fetch('https://shop.japan-toreca.com/products/pokemon-215345-a-damaged', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const jtHtml = await jtRes.text();
  
  const jtHeading = jtHtml.match(/<h1[^>]*>(.*?)<\/h1>/);
  console.log('Heading:', jtHeading ? jtHeading[1] : 'Not found');
  
  const hasSetCode = jtHtml.includes('[SV11B]');
  console.log('Has [SV11B]:', hasSetCode);
  
  // Parse with scraper regex
  const jtMatch = jtHeading[1].match(/】\s*(.+?)\s+(AR|SR|SAR)\s*\((\d+\/\d+)\)/);
  console.log('Regex match:', jtMatch ? {
    name: jtMatch[1],
    rarity: jtMatch[2],
    number: jtMatch[3]
  } : 'No match');
}

checkSpecific().catch(console.error);
