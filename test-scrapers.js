// Test M3 AR card scrapers
console.log('🔍 Testing M3 AR card scrapers...');

// Import the scraper functions
const scrapers = require('./src/lib/scrapers');

async function testScrapers() {
  try {
    console.log('📦 Connecting to Japan-Toreca and TorecaCamp...');
    
    // Test the scrapers (we'll see what they return)
    const results = await scrapers.scrapeM3ARCards();
    
    console.log('');
    console.log('📊 Test Results:');
    
    results.forEach((result, index) => {
      console.log(`\n🌐 Source: ${result.source}`);
      console.log(`\tCards found: ${result.cards.length}`);
      
      if (result.cards.length > 0) {
        console.log('\tFirst card example:');
        console.log(`\t\tName: ${result.cards[0].name || 'N/A'}`);
        console.log(`\t\tPrice: ¥${result.cards[0].price.toLocaleString() || 'N/A'}`);
        console.log(`\t\tQuality: ${result.cards[0].quality || 'N/A'}`);
        console.log(`\t\tAvailability: ${result.cards[0].availability || 'N/A'}`);
      } else {
        console.log('\tNo cards found yet - this is normal if the scraper needs adjustments');
      }
    });
    
    console.log('');
    console.log('💡 What this means:');
    console.log('- If cards are found: The scrapers are working and can extract data');
    console.log('- If no cards found: The scraper might need adjustments for the website structure');
    console.log('- If errors: There might be connection issues or the website structure changed');
    
  } catch (error) {
    console.log('\n🚨 Error occurred:');
    console.log(error.message);
    console.log('This usually means the scraper needs to be adjusted for the website changes');
  }
}

testScrapers().catch(console.error);