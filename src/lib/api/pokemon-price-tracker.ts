import axios from 'axios';

export interface CardPriceData {
  id: string;
  name: string;
  cardNumber: string;
  prices: {
    market?: number;
    tcgplayer?: number;
    ebay?: number;
  };
  rarity: string;
  set: string;
  lastUpdated: string;
}

export interface PokemonPriceTrackerResponse {
  data: CardPriceData[];
  total: number;
  limit: number;
  offset: number;
}

export class PokemonPriceTrackerAPI {
  private apiKey: string;
  private baseUrl = 'https://www.pokemonpricetracker.com/api/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    try {
      const response = await axios.get<T>(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        params
      });
      
      return response.data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  async searchCards(query: string, params: Record<string, any> = {}): Promise<PokemonPriceTrackerResponse> {
    return this.request<PokemonPriceTrackerResponse>(`/cards?search=${encodeURIComponent(query)}`, params);
  }

  async getCard(cardId: string): Promise<CardPriceData> {
    return this.request<CardPriceData>(`/cards/${cardId}`);
  }

  async getCardsBySet(setName: string, params: Record<string, any> = {}): Promise<PokemonPriceTrackerResponse> {
    return this.request<PokemonPriceTrackerResponse>(`/cards?set=${encodeURIComponent(setName)}`, params);
  }

  async getSets(): Promise<any[]> {
    return this.request<any[]>('/sets');
  }

  async getCardHistory(cardId: string, startDate?: string, endDate?: string): Promise<any> {
    const params: Record<string, any> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    return this.request<any>(`/cards/${cardId}/history`, params);
  }

  async searchByRarity(rarity: string, params: Record<string, any> = {}): Promise<PokemonPriceTrackerResponse> {
    return this.request<PokemonPriceTrackerResponse>(`/cards?rarity=${encodeURIComponent(rarity)}`, params);
  }

  async searchByCardNumber(cardNumber: string, params: Record<string, any> = {}): Promise<PokemonPriceTrackerResponse> {
    return this.request<PokemonPriceTrackerResponse>(`/cards?cardNumber=${encodeURIComponent(cardNumber)}`, params);
  }
}

export const pokemonPriceTrackerAPI = new PokemonPriceTrackerAPI(
  process.env.POKEMON_PRICE_TRACKER_API_KEY || ''
);