// Test script for scrapers
const { scrapeM3ARCards, scrapeSpecificCard } = require('./src/lib/scrapers.ts');

async function main() {
  console.log('='.repeat(60));
  console.log('Testing M3 AR Cards Scrapers');
  console.log('='.repeat(60));
  
  try {
    // Test main scraper
    const results = await scrapeM3ARCards();
    
    results.forEach(result => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Source: ${result.source.toUpperCase()}`);
      console.log(`Scraped at: ${result.scrapedAt}`);
      console.log(`Total cards: ${result.cards.length}`);
      console.log(`${'='.repeat(60)}\n`);
      
      // Group by availability
      const inStock = result.cards.filter(c => c.availability === 'in_stock');
      const outOfStock = result.cards.filter(c => c.availability === 'out_of_stock');
      
      console.log(`📦 In Stock: ${inStock.length}`);
      console.log(`🚫 Out of Stock: ${outOfStock.length}\n`);
      
      // Show first 5 cards as sample
      console.log('Sample cards:');
      result.cards.slice(0, 5).forEach((card, idx) => {
        console.log(`\n${idx + 1}. ${card.name} (${card.cardNumber})`);
        console.log(`   Quality: ${card.quality || 'N/A'}`);
        console.log(`   Price: ¥${card.price}${card.priceRange ? ` (¥${card.priceRange.min}-¥${card.priceRange.max})` : ''}`);
        console.log(`   Stock: ${card.stock !== null ? card.stock : 'Unknown'}`);
        console.log(`   Status: ${card.availability === 'in_stock' ? '✅ In Stock' : '❌ Out of Stock'}`);
        console.log(`   URL: ${card.url}`);
      });
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('Testing specific card scraper...');
    console.log('='.repeat(60));
    
    // Test specific card URLs
    const testUrls = [
      'https://shop.japan-toreca.com/products/pokemon-227733-a-damaged?_pos=8&_sid=a60fbaa04&_ss=r',
      'https://torecacamp-pokemon.com/products/rc_itnwe13e8nps_pjoz?_pos=8&_sid=d5e94dd4a&_ss=r'
    ];
    
    for (const url of testUrls) {
      const card = await scrapeSpecificCard(url);
      if (card) {
        console.log(`\n✅ Successfully scraped: ${card.name}`);
        console.log(`   Card Number: ${card.cardNumber}`);
        console.log(`   Quality: ${card.quality || 'N/A'}`);
        console.log(`   Price: ¥${card.price}`);
        console.log(`   Stock: ${card.stock}`);
        console.log(`   Status: ${card.availability}`);
      } else {
        console.log(`\n❌ Failed to scrape: ${url}`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
    process.exit(1);
  }
}

main();
