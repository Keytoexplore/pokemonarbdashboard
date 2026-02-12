import { CardData } from './scrapers';
import * as fs from 'fs';
import * as path from 'path';

export interface HistoricalPrice {
  price: number;
  availability: 'in_stock' | 'out_of_stock';
  stock: number | null;
  timestamp: string;
}

export interface CardRecord extends CardData {
  priceHistory: HistoricalPrice[];
  firstSeen: string;
  lastSeen: string;
}

export class CardStorage {
  private dataDir: string;
  private currentDataFile: string;
  private historyFile: string;

  constructor(dataDir: string = './data') {
    this.dataDir = dataDir;
    this.currentDataFile = path.join(dataDir, 'current-cards.json');
    this.historyFile = path.join(dataDir, 'price-history.json');
    
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  // Save current cards data
  async saveCurrentCards(cards: CardData[]): Promise<void> {
    try {
      const data = {
        lastUpdated: new Date().toISOString(),
        cards: cards
      };
      
      fs.writeFileSync(this.currentDataFile, JSON.stringify(data, null, 2));
      console.log(`💾 Saved ${cards.length} cards to ${this.currentDataFile}`);
    } catch (error) {
      console.error('Error saving current cards:', error);
      throw error;
    }
  }

  // Load current cards data
  async loadCurrentCards(): Promise<CardData[]> {
    try {
      if (!fs.existsSync(this.currentDataFile)) {
        return [];
      }
      
      const data = JSON.parse(fs.readFileSync(this.currentDataFile, 'utf-8'));
      return data.cards || [];
    } catch (error) {
      console.error('Error loading current cards:', error);
      return [];
    }
  }

  // Update price history
  async updatePriceHistory(cards: CardData[]): Promise<void> {
    try {
      let history: Record<string, CardRecord> = {};
      
      // Load existing history
      if (fs.existsSync(this.historyFile)) {
        history = JSON.parse(fs.readFileSync(this.historyFile, 'utf-8'));
      }
      
      const now = new Date().toISOString();
      
      // Update history with new data
      for (const card of cards) {
        const key = card.id;
        
        if (history[key]) {
          // Update existing card
          const record = history[key];
          record.lastSeen = now;
          
          // Add new price point to history
          record.priceHistory.push({
            price: card.price,
            availability: card.availability,
            stock: card.stock,
            timestamp: now
          });
          
          // Update current data
          record.price = card.price;
          record.availability = card.availability;
          record.stock = card.stock;
          
          // Keep only last 100 price points to avoid file bloat
          if (record.priceHistory.length > 100) {
            record.priceHistory = record.priceHistory.slice(-100);
          }
        } else {
          // Add new card
          history[key] = {
            ...card,
            priceHistory: [{
              price: card.price,
              availability: card.availability,
              stock: card.stock,
              timestamp: now
            }],
            firstSeen: now,
            lastSeen: now
          };
        }
      }
      
      fs.writeFileSync(this.historyFile, JSON.stringify(history, null, 2));
      console.log(`📊 Updated price history for ${cards.length} cards`);
    } catch (error) {
      console.error('Error updating price history:', error);
      throw error;
    }
  }

  // Get price history for a specific card
  async getCardHistory(cardId: string): Promise<CardRecord | null> {
    try {
      if (!fs.existsSync(this.historyFile)) {
        return null;
      }
      
      const history = JSON.parse(fs.readFileSync(this.historyFile, 'utf-8'));
      return history[cardId] || null;
    } catch (error) {
      console.error('Error getting card history:', error);
      return null;
    }
  }

  // Get all cards with history
  async getAllCardsWithHistory(): Promise<CardRecord[]> {
    try {
      if (!fs.existsSync(this.historyFile)) {
        return [];
      }
      
      const history = JSON.parse(fs.readFileSync(this.historyFile, 'utf-8'));
      return Object.values(history);
    } catch (error) {
      console.error('Error getting all cards with history:', error);
      return [];
    }
  }

  // Calculate profit margins
  async calculateProfitMargins(): Promise<Array<{
    cardName: string;
    cardNumber: string;
    qualityA: { price: number; source: string } | null;
    qualityAMinus: { price: number; source: string } | null;
    qualityB: { price: number; source: string } | null;
    lowestPrice: number;
    profitOnLowest: number;
    bestQualityForPrice: string;
  }>> {
    try {
      const allCards = await this.getAllCardsWithHistory();
      
      // Group cards by card number
      const cardsByNumber: Record<string, CardRecord[]> = {};
      
      for (const card of allCards) {
        if (!cardsByNumber[card.cardNumber]) {
          cardsByNumber[card.cardNumber] = [];
        }
        cardsByNumber[card.cardNumber].push(card);
      }
      
      const profitAnalysis = [];
      
      for (const [cardNumber, cards] of Object.entries(cardsByNumber)) {
        const qualityA = cards.find(c => c.quality === 'A');
        const qualityAMinus = cards.find(c => c.quality === 'A-');
        const qualityB = cards.find(c => c.quality === 'B');
        
        const prices = cards
          .filter(c => c.availability === 'in_stock')
          .map(c => c.price);
        
        if (prices.length === 0) continue;
        
        const lowestPrice = Math.min(...prices);
        const cardName = cards[0].name;
        
        // Find best quality at lowest price
        const bestCard = cards
          .filter(c => c.availability === 'in_stock' && c.price === lowestPrice)
          .sort((a, b) => {
            const qualityOrder = { 'A': 3, 'A-': 2, 'B': 1 };
            return (qualityOrder[b.quality as keyof typeof qualityOrder] || 0) - 
                   (qualityOrder[a.quality as keyof typeof qualityOrder] || 0);
          })[0];
        
        profitAnalysis.push({
          cardName,
          cardNumber,
          qualityA: qualityA ? { price: qualityA.price, source: qualityA.source } : null,
          qualityAMinus: qualityAMinus ? { price: qualityAMinus.price, source: qualityAMinus.source } : null,
          qualityB: qualityB ? { price: qualityB.price, source: qualityB.source } : null,
          lowestPrice,
          profitOnLowest: lowestPrice > 0 ? ((lowestPrice * 0.3) / lowestPrice * 100) : 0, // 30% profit margin example
          bestQualityForPrice: bestCard ? `${bestCard.quality} (${bestCard.source})` : 'N/A'
        });
      }
      
      return profitAnalysis.sort((a, b) => b.profitOnLowest - a.profitOnLowest);
    } catch (error) {
      console.error('Error calculating profit margins:', error);
      return [];
    }
  }
}

// Export singleton instance
export const cardStorage = new CardStorage('./data');
