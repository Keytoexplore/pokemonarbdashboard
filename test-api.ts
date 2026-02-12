#!/usr/bin/env tsx
import axios from 'axios';

const API_KEY = process.env.POKEMON_PRICE_TRACKER_API_KEY || '';
const BASE_URL = 'https://www.pokemonpricetracker.com/api/v2';

async function testAPI() {
  // Wait a bit to avoid rate limiting
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Try searching with set filter
  console.log('Searching for M3 set cards...\n');
  
  const sets = ['M3', 'SV9', 'SV8a', 'SV8'];
  
  for (const set of sets) {
    try {
      const response = await axios.get(`${BASE_URL}/cards`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        params: { 
          search: set,
          // Try different ways to filter by set
        }
      });
      
      const cards = response.data?.data || [];
      console.log(`Set "${set}": ${cards.length} results`);
      
      if (cards.length > 0) {
        cards.slice(0, 3).forEach((card: any) => {
          console.log(`  - ${card.name} | #${card.cardNumber} | Set: ${card.set} | $${card.prices?.market || 'N/A'}`);
        });
      }
    } catch (e: any) {
      console.log(`Set "${set}": ERROR - ${e.message}`);
    }
    console.log('');
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Try searching for specific card numbers
  console.log('\nTrying specific card searches...\n');
  
  const searches = [
    '098/080',
    '108/080',
    '092/080'
  ];
  
  for (const search of searches) {
    try {
      const response = await axios.get(`${BASE_URL}/cards`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        params: { search }
      });
      
      const cards = response.data?.data || [];
      console.log(`Search "${search}": ${cards.length} results`);
      
      if (cards.length > 0) {
        cards.slice(0, 2).forEach((card: any) => {
          console.log(`  - ${card.name} | #${card.cardNumber} | ${card.rarity}`);
        });
      }
    } catch (e: any) {
      console.log(`Search "${search}": ERROR - ${e.message}`);
    }
    console.log('');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

testAPI();