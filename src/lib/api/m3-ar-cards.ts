import { pokemonPriceTrackerAPI } from './pokemon-price-tracker';
import { CardData } from '../scrapers';

export interface M3ARCard {
  id: string;
  name: string;
  cardNumber: string;
  currentPrice: number | null;
  priceRange: { min: number; max: number } | null;
  rarity: string;
  set: string;
  scraperData: CardData[];
  apiData: any[];
  lastUpdated: string;
  imageUrl?: string;
}

export class M3ARCardManager {
  private cards: M3ARCard[] = [];
  private cache: Map<string, { data: any; expiresAt: number }> = new Map();
  private cacheDuration = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds

  async initialize(): Promise<void> {
    console.log('Initializing M3 AR Card Manager...');
    await this.loadCards();
  }

  private async loadCards(): Promise<void> {
    // Load the 73 M3 AR cards from scraper data
    // For now, we'll create a placeholder structure
    const cardNumbers = [
      '001/080', '002/080', '003/080', '004/080', '005/080', '006/080', '007/080', '008/080',
      '009/080', '010/080', '011/080', '012/080', '013/080', '014/080', '015/080', '016/080',
      '017/080', '018/080', '019/080', '020/080', '021/080', '022/080', '023/080', '024/080',
      '025/080', '026/080', '027/080', '028/080', '029/080', '030/080', '031/080', '032/080',
      '033/080', '034/080', '035/080', '036/080', '037/080', '038/080', '039/080', '040/080',
      '041/080', '042/080', '043/080', '044/080', '045/080', '046/080', '047/080', '048/080',
      '049/080', '050/080', '051/080', '052/080', '053/080', '054/080', '055/080', '056/080',
      '057/080', '058/080', '059/080', '060/080', '061/080', '062/080', '063/080', '064/080',
      '065/080', '066/080', '067/080', '068/080', '069/080', '070/080', '071/080', '072/080',
      '073/080'
    ];

    this.cards = cardNumbers.map(cardNumber => ({
      id: `m3-ar-${cardNumber}`,
      name: 'Unknown',
      cardNumber,
      currentPrice: null,
      priceRange: null,
      rarity: 'Special Illustration Rare',
      set: 'M3',
      scraperData: [],
      apiData: [],
      lastUpdated: new Date().toISOString()
    }));

    console.log('✅ Loaded ${this.cards.length} M3 AR cards');
  }

  async fetchAPIData(): Promise<void> {
    console.log('Fetching data from Pokemon Price Tracker API...');
    
    const batchSize = 10;
    const totalBatches = Math.ceil(this.cards.length / batchSize);
    
    for (let i = 0; i < totalBatches; i++) {
      const batch = this.cards.slice(i * batchSize, (i + 1) * batchSize);
      
      console.log('Processing batch ${i + 1}/${totalBatches}...');
      
      await Promise.allSettled(
        batch.map(async (card) => {
          try {
            const cached = this.getCached(card.id);
            if (cached && cached.expiresAt > Date.now()) {
              console.log('Using cached data for ${card.cardNumber}');
              card.apiData = cached.data;
              return;
            }

            const response = await pokemonPriceTrackerAPI.searchCards(
              card.cardNumber,
              { rarity: 'Special Illustration Rare', set: 'M3' }
            );

            if (response.data.length > 0) {
              card.apiData = response.data;
              this.setCache(card.id, response.data);
              console.log('✅ Found data for ${card.cardNumber}');
            } else {
              console.log('⚠️ No data found for ${card.cardNumber}');
            }
          } catch (error) {
            console.error('❌ Error fetching data for ${card.cardNumber}:', error);
          }
        }
      ));

      // Rate limiting: 60 requests per minute = 1 request per second
      if (i < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('✅ API data fetching completed!');
  }

  async updatePrices(): Promise<void> {
    console.log('Updating prices for all cards...');
    
    for (const card of this.cards) {
      try {
        if (card.apiData.length > 0) {
          const latestData = card.apiData[0]; // Use the most recent data
          card.currentPrice = latestData.prices?.market || null;
          card.priceRange = {
            min: latestData.prices?.market || 0,
            max: latestData.prices?.market || 0
          };
          card.lastUpdated = new Date().toISOString();
          console.log('✅ Updated price for ${card.cardNumber}: ¥${card.currentPrice}');
        }
      } catch (error) {
        console.error('❌ Error updating price for ${card.cardNumber}:', error);
      }
    }

    console.log('✅ Price updates completed!');
  }

  async saveToFiles(): Promise<void> {
    const dataPath = './data/m3-ar-cards.json';
    
    try {
      const cardData = {
        lastUpdated: new Date().toISOString(),
        cards: this.cards,
        cacheInfo: {
          entries: this.cache.size,
          cacheDuration: '${this.cacheDuration / (24 * 60 * 60 * 1000)} days'
        }
      };

      // Write to file
      const fs = await import('node:fs');
      await fs.promises.mkdir('./data', { recursive: true });
      await fs.promises.writeFile(dataPath, JSON.stringify(cardData, null, 2));

      console.log('✅ Saved data to ${dataPath}');
      return dataPath;
    } catch (error) {
      console.error('❌ Error saving data to files:', error);
      throw error;
    }
  }

  private getCached(cardId: string): { data: any; expiresAt: number } | null {
    const cached = this.cache.get(cardId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached;
    }
    this.cache.delete(cardId);
    return null;
  }

  private setCache(cardId: string, data: any): void {
    this.cache.set(cardId, {
      data,
      expiresAt: Date.now() + this.cacheDuration
    });
  }

  getCards(): M3ARCard[] {
    return this.cards;
  }

  getCard(cardNumber: string): M3ARCard | undefined {
    return this.cards.find(card => card.cardNumber === cardNumber);
  }

  getCardsWithPrices(): M3ARCard[] {
    return this.cards.filter(card => card.currentPrice !== null);
  }

  getCardsWithoutPrices(): M3ARCard[] {
    return this.cards.filter(card => card.currentPrice === null);
  }

  getCacheStats(): {
    totalEntries: number;
    cacheDuration: string;
    expiredEntries: number;
    validEntries: number;
  } {
    const now = Date.now();
    const validEntries = Array.from(this.cache.values()).filter(entry => entry.expiresAt > now).length;
    
    return {
      totalEntries: this.cache.size,
      cacheDuration: '${this.cacheDuration / (24 * 60 * 60 * 1000)} days',
      expiredEntries: this.cache.size - validEntries,
      validEntries
    };
  }
}

export const m3ARCardManager = new M3ARCardManager();