'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { ArbitrageOpportunity } from '@/lib/types';

interface CardsWithFiltersProps {
  initialCards: ArbitrageOpportunity[];
  totalCards: number;
  viableOpportunities?: number;
  avgMargin?: number;
  lastUpdated?: string;
}

// Get card image URL from US price data or fallback to PokemonTCG.io
function getCardImageUrl(card: ArbitrageOpportunity): string {
  // Use TCGPlayer CDN image if available
  if (card.usPrice?.imageCdnUrl) {
    return card.usPrice.imageCdnUrl;
  }
  if (card.usPrice?.imageUrl) {
    return card.usPrice.imageUrl;
  }
  if (card.imageUrl) {
    return card.imageUrl;
  }
  // Fallback to PokemonTCG.io
  return `https://images.pokemontcg.io/${card.set.toLowerCase()}/${card.cardNumber.split('/')[0]}_hires.png`;
}

export function CardsWithFilters({
  initialCards,
  totalCards,
  viableOpportunities,
  avgMargin,
  lastUpdated
}: CardsWithFiltersProps) {
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('profit-desc');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate arbitrage opportunities between Japanese sources
  const cardsWithArbitrage = useMemo(() => {
    return initialCards.map(card => {
      const japanToreca = card.japanesePrices.find(p => p.source === 'japan-toreca');
      const torecaCamp = card.japanesePrices.find(p => p.source === 'torecacamp');

      // Calculate arbitrage between Japanese sources
      let arbitrage: { margin: number; cheaperSource: string; savings: number } | null = null;

      if (japanToreca?.inStock && torecaCamp?.inStock) {
        const jtPrice = japanToreca.priceJPY;
        const tcPrice = torecaCamp.priceJPY;

        if (jtPrice !== tcPrice) {
          const cheaper = jtPrice < tcPrice ? 'Japan-Toreca' : 'TorecaCamp';
          const cheaperPrice = Math.min(jtPrice, tcPrice);
          const expensivePrice = Math.max(jtPrice, tcPrice);
          const margin = Math.round(((expensivePrice - cheaperPrice) / cheaperPrice) * 100);

          arbitrage = {
            margin,
            cheaperSource: cheaper,
            savings: expensivePrice - cheaperPrice
          };
        }
      }

      return { ...card, japanToreca, torecaCamp, arbitrage };
    });
  }, [initialCards]);

  const filteredCards = useMemo(() => {
    let cards = [...cardsWithArbitrage];

    // Filter by rarity
    if (filterRarity !== 'all') {
      cards = cards.filter(c => c.rarity === filterRarity);
    }

    // Filter by search
    if (searchQuery) {
      cards = cards.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.cardNumber.includes(searchQuery)
      );
    }

    // Sort
    cards.sort((a, b) => {
      if (sortBy === 'profit-desc') {
        return (b.arbitrage?.margin || 0) - (a.arbitrage?.margin || 0);
      }
      if (sortBy === 'profit-asc') {
        return (a.arbitrage?.margin || 0) - (b.arbitrage?.margin || 0);
      }
      if (sortBy === 'price-asc') {
        const lowestA = a.japanesePrices.find(p => p.isLowest)?.priceJPY || 999999;
        const lowestB = b.japanesePrices.find(p => p.isLowest)?.priceJPY || 999999;
        return lowestA - lowestB;
      }
      if (sortBy === 'price-desc') {
        const lowestA = a.japanesePrices.find(p => p.isLowest)?.priceJPY || 0;
        const lowestB = b.japanesePrices.find(p => p.isLowest)?.priceJPY || 0;
        return lowestB - lowestA;
      }
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

    return cards;
  }, [cardsWithArbitrage, filterRarity, sortBy, searchQuery]);

  // Count arbitrage opportunities
  const arbitrageCount = filteredCards.filter(c => c.arbitrage && c.arbitrage.margin > 5).length;

  return (
    <div>
      {/* Stats */}
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 mb-6 text-white">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div>
            <p className="text-sm opacity-75">Total Cards</p>
            <p className="text-2xl font-bold">{totalCards}</p>
          </div>
          <div>
            <p className="text-sm opacity-75">Showing</p>
            <p className="text-2xl font-bold">{filteredCards.length}</p>
          </div>
          <div>
            <p className="text-sm opacity-75 text-emerald-400">JP→US Ops</p>
            <p className="text-2xl font-bold text-emerald-400">{viableOpportunities || 0}</p>
          </div>
          <div>
            <p className="text-sm opacity-75 text-amber-400">Avg Margin</p>
            <p className="text-2xl font-bold text-amber-400">{(avgMargin || 0).toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-sm opacity-75">Last Updated</p>
            <p className="text-sm font-mono mt-1">{lastUpdated ? new Date(lastUpdated).toLocaleDateString() : new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-md rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="text-white/75 text-sm block mb-1">Search</label>
            <input
              type="text"
              placeholder="Card name or number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Rarity Filter */}
          <div>
            <label className="text-white/75 text-sm block mb-1">Rarity</label>
            <select
              value={filterRarity}
              onChange={(e) => setFilterRarity(e.target.value)}
              className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all" className="bg-gray-900">All Rarities</option>
              <option value="SAR" className="bg-gray-900">SAR - Special Art Rare</option>
              <option value="AR" className="bg-gray-900">AR - Art Rare</option>
              <option value="SR" className="bg-gray-900">SR - Super Rare</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="text-white/75 text-sm block mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="profit-desc" className="bg-gray-900">Profit % (High to Low)</option>
              <option value="price-asc" className="bg-gray-900">Price: Low to High</option>
              <option value="price-desc" className="bg-gray-900">Price: High to Low</option>
              <option value="name" className="bg-gray-900">Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCards.map((card) => {
          const lowest = card.japanesePrices.find(p => p.isLowest) || card.japanesePrices[0];
          const imageUrl = getCardImageUrl(card);
          const tcgPlayerUrl = card.usPrice?.tcgPlayerUrl;

          return (
            <div key={card.id} className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden border border-white/20 hover:border-purple-500/50 transition hover:scale-[1.02]">
              {/* Card Image */}
              <div className="relative aspect-[3/4] bg-gradient-to-br from-purple-900/50 to-blue-900/50">
                <Image
                  src={imageUrl}
                  alt={card.name}
                  fill
                  className="object-contain p-2"
                  unoptimized
                  onError={(e) => {
                    // Show placeholder on error
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = `
                      <div class="flex items-center justify-center h-full text-white/50">
                        <div class="text-center">
                          <div class="text-4xl mb-2">🎴</div>
                          <p class="text-sm">${card.cardNumber}</p>
                        </div>
                      </div>
                    `;
                  }}
                />
              </div>

              <div className="p-4 space-y-3">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white">{card.name}</h3>
                    <p className="text-sm text-purple-200">{card.set} #{card.cardNumber}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-bold ${
                    card.rarity === 'SAR' ? 'bg-amber-600' :
                    card.rarity === 'AR' ? 'bg-cyan-600' : 'bg-violet-600'
                  }`}>
                    {card.rarity}
                  </span>
                </div>

                {/* Lowest Price */}
                {lowest && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-white/60 text-sm">Lowest Price</p>
                    <p className="text-2xl font-bold text-emerald-400">
                      ¥{lowest.priceJPY.toLocaleString()}
                    </p>
                    <p className="text-white/50 text-sm">~${lowest.priceUSD.toFixed(2)}</p>
                  </div>
                )}

                {/* US Market Info */}
                {card.usPrice && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <p className="text-blue-300 text-sm">US Market (TCGPlayer)</p>
                    <div className="flex justify-between items-center">
                      <p className="text-xl font-bold text-white">
                        ${card.usPrice.marketPrice.toFixed(2)}
                      </p>
                      <p className="text-white/50 text-xs">{card.usPrice.sellerCount} sellers</p>
                    </div>
                  </div>
                )}

                {/* Arbitrage Opportunity */}
                {card.arbitrage && card.arbitrage.margin > 5 && (
                  <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-lg p-3">
                    <p className="text-emerald-400 text-sm font-bold">
                      🔥 Arbitrage Opportunity!
                    </p>
                    <p className="text-white text-sm">
                      Buy from {card.arbitrage.cheaperSource} for ¥{lowest?.priceJPY.toLocaleString()}
                    </p>
                    <p className="text-emerald-400 text-lg font-bold">
                      Save ¥{card.arbitrage.savings} ({card.arbitrage.margin}%)
                    </p>
                  </div>
                )}

                {/* Links */}
                <div className="space-y-2 pt-2">
                  {tcgPlayerUrl && (
                    <a
                      href={tcgPlayerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex justify-between items-center bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-500/40 rounded-lg px-4 py-3 transition"
                    >
                      <span className="text-emerald-300 text-sm font-semibold">📈 TCGPlayer Listings</span>
                      <span className="text-emerald-400 text-xs">View →</span>
                    </a>
                  )}

                  {card.japanToreca?.inStock && (
                    <a
                      href={card.japanToreca.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex justify-between items-center bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg px-4 py-3 transition"
                    >
                      <span className="text-blue-300 text-sm">Japan-Toreca</span>
                      <div className="text-right">
                        <span className="text-white font-bold">¥{card.japanToreca.priceJPY.toLocaleString()}</span>
                        {card.japanToreca.quality && (
                          <span className="text-white/50 text-xs ml-2">({card.japanToreca.quality})</span>
                        )}
                      </div>
                    </a>
                  )}

                  {card.torecaCamp?.inStock && (
                    <a
                      href={card.torecaCamp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex justify-between items-center bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg px-4 py-3 transition"
                    >
                      <span className="text-purple-300 text-sm">TorecaCamp</span>
                      <span className="text-white font-bold">¥{card.torecaCamp.priceJPY.toLocaleString()}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCards.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎴</div>
          <p className="text-xl text-white/70">No cards match your filters</p>
          <button
            onClick={() => {
              setFilterRarity('all');
              setSearchQuery('');
              setSortBy('profit-desc');
            }}
            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white transition"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
