import { M3ARCardManager, m3ARCardManager } from './m3-ar-cards';
import { pokemonPriceTrackerAPI } from './pokemon-price-tracker';

export interface RateLimitInfo {
  requests: number;
  limit: number;
  remaining: number;
  resetTime: Date;
  cardsProcessed: number;
  batchesProcessed: number;
}

export class M3ARCardAPIIntegration {
  private rateLimitInfo: RateLimitInfo = {
    requests: 0,
    limit: 60,
    remaining: 60,
    resetTime: new Date(Date.now() + 60 * 1000),
    cardsProcessed: 0,
    batchesProcessed: 0
  };

  private readonly apiKey: string;
  private readonly cardManager: M3ARCardManager;

  constructor(apiKey: string, cardManager: M3ARCardManager = m3ARCardManager) {
    this.apiKey = apiKey;
    this.cardManager = cardManager;
  }

  async initialize(): Promise<boolean> {
    console.log('Initializing M3 AR Card API Integration...');
    
    try {
      await this.cardManager.initialize();
      console.log('✅ Card manager initialized');
      
      // Test API connection
      const testResponse = await pokemonPriceTrackerAPI.getSets();
      console.log('✅ Pokemon Price Tracker API connected');
      
      return true;
    } catch (error) {
      console.error('❌ Error initializing integration:', error);
      return false;
    }
  }

  async fetchCardData(cardNumber: string): Promise<any> {
    try {
      this.checkRateLimit();
      
      const response = await pokemonPriceTrackerAPI.searchCards(
        cardNumber,
        { rarity: 'Special Illustration Rare', set: 'M3' }
      );

      this.updateRateLimit();
      return response;
    } catch (error) {
      console.error('❌ Error fetching data for ${cardNumber}:', error);
      throw error;
    }
  }

  async fetchBatchData(cardNumbers: string[]): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    
    for (const cardNumber of cardNumbers) {
      try {
        const data = await this.fetchCardData(cardNumber);
        results.set(cardNumber, data);
        
        // Rate limiting between requests
        await this.sleep(1000); // 1 second between requests
      } catch (error) {
        console.error('❌ Error processing ${cardNumber}:', error);
        results.set(cardNumber, { error: error.message });
      }
    }
    
    return results;
  }

  async processAllCards(): Promise<void> {
    console.log('Processing all M3 AR cards...');
    
    const cards = this.cardManager.getCards();
    const cardNumbers = cards.map(card => card.cardNumber);
    
    console.log('Total cards to process: ${cards.length}');
    
    const batchSize = 10;
    const totalBatches = Math.ceil(cards.length / batchSize);
    
    for (let i = 0; i < totalBatches; i++) {
      const batchNumbers = cardNumbers.slice(i * batchSize, (i + 1) * batchSize);
      console.log('Processing batch ${i + 1}/${totalBatches} (${batchNumbers.length} cards)...');
      
      try {
        const batchResults = await this.fetchBatchData(batchNumbers);
        
        // Update card manager with batch results
        this.updateCardManagerWithResults(batchResults);
        
        this.rateLimitInfo.batchesProcessed++;
        this.rateLimitInfo.cardsProcessed += batchNumbers.length;
        
        console.log('✅ Batch ${i + 1} completed');
      } catch (error) {
        console.error('❌ Error processing batch ${i + 1}:', error);
      }
      
      // Wait before next batch to respect rate limits
      if (i < totalBatches - 1) {
        await this.sleep(5000); // 5 seconds between batches
      }
    }
    
    console.log('✅ All cards processed!');
    console.log('📊 Summary:');
    console.log('- Total cards processed: ${this.rateLimitInfo.cardsProcessed}');
    console.log('- Batches processed: ${this.rateLimitInfo.batchesProcessed}');
    console.log('- API requests: ${this.rateLimitInfo.requests}');
    console.log('- Remaining requests: ${this.rateLimitInfo.remaining}');
  }

  private updateCardManagerWithResults(results: Map<string, any>): void {
    results.forEach((data, cardNumber) => {
      const card = this.cardManager.getCard(cardNumber);
      if (card && data.data && data.data.length > 0) {
        card.apiData = data.data;
        card.lastUpdated = new Date().toISOString();
        
        // Update price if available
        if (data.data[0].prices?.market) {
          card.currentPrice = data.data[0].prices.market;
          card.priceRange = {
            min: data.data[0].prices.market,
            max: data.data[0].prices.market
          };
        }
      }
    });
  }

  private checkRateLimit(): void {
    if (this.rateLimitInfo.requests >= this.rateLimitInfo.limit) {
      const timeUntilReset = this.rateLimitInfo.resetTime.getTime() - Date.now();
      if (timeUntilReset > 0) {
        console.log('⏳ Rate limit reached. Waiting ${Math.ceil(timeUntilReset / 1000)} seconds...');
        await new Promise(resolve => setTimeout(resolve, timeUntilReset));
      }
      this.resetRateLimit();
    }
  }

  private updateRateLimit(): void {
    this.rateLimitInfo.requests++;
    this.rateLimitInfo.remaining--;
    
    // Update reset time if we've reached the limit
    if (this.rateLimitInfo.requests >= this.rateLimitInfo.limit) {
      this.rateLimitInfo.resetTime = new Date(Date.now() + 60 * 1000);
    }
  }

  private resetRateLimit(): void {
    this.rateLimitInfo.requests = 0;
    this.rateLimitInfo.remaining = this.rateLimitInfo.limit;
    this.rateLimitInfo.resetTime = new Date(Date.now() + 60 * 1000);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getRateLimitInfo(): RateLimitInfo {
    return { ...this.rateLimitInfo };
  }

  async saveData(): Promise<string> {
    try {
      const filePath = await this.cardManager.saveToFiles();
      console.log('✅ Data saved to ${filePath}');
      return filePath;
    } catch (error) {
      console.error('❌ Error saving data:', error);
      throw error;
    }
  }

  async refreshData(): Promise<void> {
    console.log('Refreshing all card data...');
    
    try {
      // Clear cache first
      await this.cardManager.initialize();
      
      // Process all cards
      await this.processAllCards();
      
      // Save updated data
      await this.saveData();
      
      console.log('✅ Data refresh completed!');
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
      throw error;
    }
  }

  async getCardData(cardNumber: string): Promise<{
    card: any;
    apiData: any;
    price: number | null;
    lastUpdated: string;
  } | null> {
    try {
      const card = this.cardManager.getCard(cardNumber);
      if (!card) {
        return null;
      }

      const apiData = card.apiData.length > 0 ? card.apiData[0] : null;
      const price = card.currentPrice || null;

      return {
        card,
        apiData,
        price,
        lastUpdated: card.lastUpdated
      };
    } catch (error) {
      console.error('❌ Error getting card data for ${cardNumber}:', error);
      return null;
    }
  }

  async searchCards(query: string): Promise<{
    cards: any[];
    total: number;
    withPrices: number;
    withoutPrices: number;
  }> {
    try {
      const allCards = this.cardManager.getCards();
      const filteredCards = allCards.filter(card => 
        card.name.toLowerCase().includes(query.toLowerCase()) ||
        card.cardNumber.includes(query)
      );

      const withPrices = filteredCards.filter(card => card.currentPrice !== null).length;
      const withoutPrices = filteredCards.filter(card => card.currentPrice === null).length;

      return {
        cards: filteredCards,
        total: filteredCards.length,
        withPrices,
        withoutPrices
      };
    } catch (error) {
      console.error('❌ Error searching cards:', error);
      throw error;
    }
  }
}

export const m3ARCardAPIIntegration = new M3ARCardAPIIntegration(
  process.env.POKEMON_PRICE_TRACKER_API_KEY || ''
);