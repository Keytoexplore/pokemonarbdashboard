'use client';

import { useState, useMemo } from 'react';
import { ArbitrageOpportunity } from '@/lib/types';

interface CardsWithFiltersProps {
  initialCards: ArbitrageOpportunity[];
  totalCards: number;
}

export function CardsWithFilters({ initialCards, totalCards }: CardsWithFiltersProps) {
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('price-asc');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCards = useMemo(() => {
    let cards = [...initialCards];

    // Filter by rarity
    if (filterRarity !== 'all') {
      cards = cards.filter(c => c.rarity === filterRarity);
    }

    // Filter by source
    if (filterSource !== 'all') {
      cards = cards.filter(c => 
        c.japanesePrices.some(p => p.source === filterSource && p.inStock)
      );
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
      const lowestA = a.japanesePrices.find(p => p.isLowest)?.priceJPY || 999999;
      const lowestB = b.japanesePrices.find(p => p.isLowest)?.priceJPY || 999999;
      
      if (sortBy === 'price-asc') return lowestA - lowestB;
      if (sortBy === 'price-desc') return lowestB - lowestA;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

    return cards;
  }, [initialCards, filterRarity, filterSource, sortBy, searchQuery]);

  return (
    <div>
      {/* Stats */}
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 mb-6 text-white">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-sm opacity-75">Total Cards</p>
            <p className="text-2xl font-bold">{totalCards}</p>
          </div>
          <div>
            <p className="text-sm opacity-75">Showing</p>
            <p className="text-2xl font-bold">{filteredCards.length}</p>
          </div>
          <div>
            <p className="text-sm opacity-75">Sets</p>
            <p className="text-2xl font-bold">M3</p>
          </div>
          <div>
            <p className="text-sm opacity-75">Last Updated</p>
            <p className="text-sm font-mono mt-1">{new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-md rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          {/* Source Filter */}
          <div>
            <label className="text-white/75 text-sm block mb-1">Source</label>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all" className="bg-gray-900">All Sources</option>
              <option value="japan-toreca" className="bg-gray-900">Japan-Toreca</option>
              <option value="torecacamp" className="bg-gray-900">TorecaCamp</option>
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
          const japanToreca = card.japanesePrices.find(p => p.source === 'japan-toreca');
          const torecaCamp = card.japanesePrices.find(p => p.source === 'torecacamp');

          return (
            <div key={card.id} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:border-purple-500/50 transition">
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-white">{card.name}</h3>
                <span className={`text-xs px-2 py-1 rounded font-bold ${
                  card.rarity === 'SAR' ? 'bg-amber-600' : 
                  card.rarity === 'AR' ? 'bg-cyan-600' : 'bg-violet-600'
                }`}>
                  {card.rarity}
                </span>
              </div>

              <p className="text-white/60 text-sm mb-4">
                {card.set} #{card.cardNumber}
              </p>

              {/* Price */}
              {lowest && (
                <div className="mb-4">
                  <p className="text-white/60 text-sm">Lowest Price</p>
                  <p className="text-3xl font-bold text-emerald-400">
                    ¥{lowest.priceJPY.toLocaleString()}
                  </p>
                  <p className="text-white/50 text-sm">
                    ~${lowest.priceUSD.toFixed(2)}
                  </p>
                </div>
              )}

              {/* Links */}
              <div className="space-y-2">
                {japanToreca && (
                  <a
                    href={japanToreca.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex justify-between items-center bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg px-4 py-3 transition"
                  >
                    <span className="text-blue-300 text-sm">Japan-Toreca</span>
                    <div className="text-right">
                      <span className="text-white font-bold">¥{japanToreca.priceJPY.toLocaleString()}</span>
                      {japanToreca.quality && (
                        <span className="text-white/50 text-xs ml-2">({japanToreca.quality})</span>
                      )}
                    </div>
                  </a>
                )}

                {torecaCamp && (
                  <a
                    href={torecaCamp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex justify-between items-center bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg px-4 py-3 transition"
                  >
                    <span className="text-purple-300 text-sm">TorecaCamp</span>
                    <span className="text-white font-bold">¥{torecaCamp.priceJPY.toLocaleString()}</span>
                  </a>
                )}
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
              setFilterSource('all');
              setSearchQuery('');
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