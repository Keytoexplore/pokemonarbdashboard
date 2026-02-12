#!/usr/bin/env tsx
import axios from 'axios';

const API_KEY = process.env.POKEMON_PRICE_TRACKER_API_KEY || '';
const BASE_URL = 'https://www.pokemonpricetracker.com/api/v2';

async function testAPI() {
  console.log('Testing Pokemon Price Tracker API with various search strategies...\n');
  
  // Wait a bit to avoid rate limiting
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Try searching for specific cards by name
  const cardNames = [
    'Lugia V',
    'Lugia VSTAR', 
    'Gardevoir',
    'Oinkologne',
    'Eevee',
    'Tyrunt',
    'Doublade',
    'Drapion',
    'Raticate',
    'Candice',
    'Lance',
    'Worker',
    'Regieleki VMAX',
    'Unown VSTAR',
    'Regidrago VSTAR'
  ];
  
  for (const cardName of cardNames) {
    try {
      console.log(`\nSearching for "${cardName}"...`);
      const response = await axios.get(`${BASE_URL}/cards`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        params: { 
          search: cardName,
          limit: 10
        }
      });
      
      const cards = response.data?.data || [];
      console.log(`  Found ${cards.length} results`);
      
      if (cards.length > 0) {
        cards.slice(0, 3).forEach((card: any) => {
          console.log(`    - ${card.name} | #${card.cardNumber} | Set: ${card.set || 'N/A'} | Rarity: ${card.rarity || 'N/A'} | $${card.prices?.market || 'N/A'}`);
        });
      }
    } catch (e: any) {
      console.log(`  ERROR: ${e.message}`);
      if (e.response?.data) {
        console.log(`  Response: ${JSON.stringify(e.response.data)}`);
      }
    }
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Try searching with set filter
  console.log('\n\n=== Testing Set Filters ===\n');
  
  const setTests = [
    { name: 'Lugia V', set: 'Silver Tempest' },
    { name: 'Gardevoir', set: 'Silver Tempest' },
    { name: 'Candice', set: 'Silver Tempest' }
  ];
  
  for (const test of setTests) {
    try {
      console.log(`\nSearching for "${test.name}" in set "${test.set}"...`);
      const response = await axios.get(`${BASE_URL}/cards`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        params: { 
          search: test.name,
          set: test.set
        }
      });
      
      const cards = response.data?.data || [];
      console.log(`  Found ${cards.length} results`);
      
      if (cards.length > 0) {
        cards.slice(0, 3).forEach((card: any) => {
          console.log(`    - ${card.name} | #${card.cardNumber} | Set: ${card.set || 'N/A'} | $${card.prices?.market || 'N/A'}`);
        });
      }
    } catch (e: any) {
      console.log(`  ERROR: ${e.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n\n=== Testing Card Number Search ===\n');
  
  // Try searching by card number
  const cardNumbers = [
    { number: '138', set: 'Silver Tempest' },
    { number: '139', set: 'Silver Tempest' },
    { number: '185', set: 'Silver Tempest' },
    { number: '186', set: 'Silver Tempest' }
  ];
  
  for (const test of cardNumbers) {
    try {
      console.log(`\nSearching for card #${test.number} in ${test.set}...`);
      const response = await axios.get(`${BASE_URL}/cards`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        params: { 
          cardNumber: test.number,
          set: test.set
        }
      });
      
      const cards = response.data?.data || [];
      console.log(`  Found ${cards.length} results`);
      
      if (cards.length > 0) {
        cards.slice(0, 2).forEach((card: any) => {
          console.log(`    - ${card.name} | #${card.cardNumber} | $${card.prices?.market || 'N/A'}`);
        });
      }
    } catch (e: any) {
      console.log(`  ERROR: ${e.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

testAPI();
