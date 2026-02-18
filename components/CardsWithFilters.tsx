'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { ArbitrageOpportunity, JapanesePrice, JapaneseCondition, RarityCode } from '@/lib/types';

interface CardsWithFiltersProps {
  initialCards: ArbitrageOpportunity[];
  totalCards: number;
  viableOpportunities?: number;
  avgMargin?: number;
  lastUpdated?: string;
}

const TRACKED_SET = 'S12a';
const DISPLAY_RARITIES: Array<RarityCode> = ['AR', 'SAR', 'SR', 'CHR', 'UR', 'SSR', 'RRR'];
const DISPLAY_CONDITIONS: Array<JapaneseCondition> = ['A-', 'B'];

// Get card image URL from US price data or fallback to PokemonTCG.io
function getCardImageUrl(card: ArbitrageOpportunity): string {
  if (card.usPrice?.imageCdnUrl) return card.usPrice.imageCdnUrl;
  if (card.usPrice?.imageUrl) return card.usPrice.imageUrl;
  if (card.imageUrl) return card.imageUrl;
  return `https://images.pokemontcg.io/${card.set.toLowerCase()}/${card.cardNumber.split('/')[0]}_hires.png`;
}

function normalizeQuality(q: unknown): JapaneseCondition | null {
  const quality = String(q || '').toUpperCase().replace('－', '-');
  if (quality === 'A-') return 'A-';
  if (quality === 'B') return 'B';
  return null;
}

// Filter prices to only include Japan-Toreca A- and B
function filterQualityPrices(prices: JapanesePrice[]): JapanesePrice[] {
  return prices.filter((p) => p.source === 'japan-toreca' && normalizeQuality(p.quality) !== null);
}

function getLowestABPrice(prices: JapanesePrice[]): {
  price: JapanesePrice | null;
  inStock: boolean;
  lowestPriceJPY: number;
  lowestPriceUSD: number;
} {
  const filteredPrices = filterQualityPrices(prices);

  if (filteredPrices.length === 0) {
    return { price: null, inStock: false, lowestPriceJPY: 0, lowestPriceUSD: 0 };
  }

  const inStockPrices = filteredPrices.filter((p) => p.inStock);
  if (inStockPrices.length > 0) {
    const lowest = inStockPrices.reduce((min, p) => (p.priceJPY < min.priceJPY ? p : min));
    return {
      price: lowest,
      inStock: true,
      lowestPriceJPY: lowest.priceJPY,
      lowestPriceUSD: lowest.priceUSD,
    };
  }

  const lowest = filteredPrices.reduce((min, p) => (p.priceJPY < min.priceJPY ? p : min));
  return {
    price: lowest,
    inStock: false,
    lowestPriceJPY: lowest.priceJPY,
    lowestPriceUSD: lowest.priceUSD,
  };
}

function getBestPriceForQuality(prices: JapanesePrice[], quality: JapaneseCondition): {
  price: JapanesePrice | null;
  inStock: boolean;
} {
  const candidates = prices
    .filter((p) => normalizeQuality(p.quality) === quality)
    .sort((a, b) => a.priceJPY - b.priceJPY);

  if (candidates.length === 0) return { price: null, inStock: false };

  const inStock = candidates.filter((p) => p.inStock);
  if (inStock.length > 0) return { price: inStock[0], inStock: true };
  return { price: candidates[0], inStock: false };
}

function rarityBadgeClass(rarity: RarityCode): string {
  switch (rarity) {
    case 'SAR':
      return 'bg-amber-600';
    case 'UR':
    case 'SSR':
      return 'bg-fuchsia-600';
    case 'SR':
      return 'bg-violet-600';
    case 'AR':
    case 'CHR':
      return 'bg-cyan-600';
    case 'RRR':
      return 'bg-slate-600';
    default:
      return 'bg-gray-600';
  }
}

type ComputedCard = ArbitrageOpportunity & {
  lowestData: ReturnType<typeof getLowestABPrice>;
  usProfitMargin: number;
};

export function CardsWithFilters({ initialCards, lastUpdated }: CardsWithFiltersProps) {
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('profit-desc');
  const [searchQuery, setSearchQuery] = useState('');

  const cardsWithData = useMemo<ComputedCard[]>(() => {
    return initialCards.map((card) => {
      const lowestData = getLowestABPrice(card.japanesePrices);

      // Calculate US profit margin using lowest A-/B price (in-stock preferred)
      let usProfitMargin = 0;
      if (card.usPrice && lowestData.lowestPriceUSD > 0) {
        usProfitMargin = Math.round(
          ((card.usPrice.marketPrice - lowestData.lowestPriceUSD) / lowestData.lowestPriceUSD) * 100
        );
      }

      return {
        ...card,
        lowestData,
        usProfitMargin,
      };
    });
  }, [initialCards]);

  const filteredCards = useMemo<ComputedCard[]>(() => {
    let cards = [...cardsWithData];

    // Filter by rarity
    if (filterRarity !== 'all') {
      cards = cards.filter((c) => c.rarity === filterRarity);
    }

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      cards = cards.filter((c) => c.name.toLowerCase().includes(q) || c.cardNumber.includes(searchQuery));
    }

    // Sort
    cards.sort((a, b) => {
      if (sortBy === 'profit-desc') return b.usProfitMargin - a.usProfitMargin;
      if (sortBy === 'profit-asc') return a.usProfitMargin - b.usProfitMargin;
      if (sortBy === 'price-asc') return a.lowestData.lowestPriceJPY - b.lowestData.lowestPriceJPY;
      if (sortBy === 'price-desc') return b.lowestData.lowestPriceJPY - a.lowestData.lowestPriceJPY;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

    return cards;
  }, [cardsWithData, filterRarity, sortBy, searchQuery]);

  return (
    <div>
      {/* Stats */}
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 mb-6 text-white">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div>
            <p className="text-sm opacity-75">Set</p>
            <p className="text-lg font-bold">{TRACKED_SET}</p>
          </div>
          <div>
            <p className="text-sm opacity-75">Showing</p>
            <p className="text-2xl font-bold">{filteredCards.length}</p>
          </div>
          <div>
            <p className="text-sm opacity-75 text-emerald-400">JP→US Ops</p>
            <p className="text-2xl font-bold text-emerald-400">{filteredCards.filter((c) => c.isViable).length}</p>
          </div>
          <div>
            <p className="text-sm opacity-75 text-amber-400">Avg Margin</p>
            <p className="text-2xl font-bold text-amber-400">
              {filteredCards.length > 0
                ? (filteredCards.reduce((s, c) => s + c.usProfitMargin, 0) / filteredCards.length).toFixed(1)
                : '0.0'}%
            </p>
          </div>
          <div>
            <p className="text-sm opacity-75">Last Updated</p>
            <p className="text-sm font-mono mt-1">
              {lastUpdated ? new Date(lastUpdated).toLocaleDateString() : new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-md rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <div>
            <label className="text-white/75 text-sm block mb-1">Rarity</label>
            <select
              value={filterRarity}
              onChange={(e) => setFilterRarity(e.target.value)}
              className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all" className="bg-gray-900">
                All Rarities
              </option>
              {DISPLAY_RARITIES.map((r) => (
                <option key={r} value={r} className="bg-gray-900">
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-white/75 text-sm block mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="profit-desc" className="bg-gray-900">
                Profit % (High to Low)
              </option>
              <option value="profit-asc" className="bg-gray-900">
                Profit % (Low to High)
              </option>
              <option value="price-asc" className="bg-gray-900">
                JP Price: Low to High
              </option>
              <option value="price-desc" className="bg-gray-900">
                JP Price: High to Low
              </option>
              <option value="name" className="bg-gray-900">
                Name
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCards.map((card) => {
          const imageUrl = getCardImageUrl(card);
          const tcgPlayerUrl = card.usPrice?.tcgPlayerUrl;
          const { lowestData, usProfitMargin } = card;

          // Group Japan-Toreca prices by quality (A-/B)
          const jtPrices = filterQualityPrices(card.japanesePrices);
          const jtByQuality = DISPLAY_CONDITIONS.map((q) => ({ q, ...getBestPriceForQuality(jtPrices, q) }));

          return (
            <div
              key={card.id}
              className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden border border-white/20 hover:border-purple-500/50 transition hover:scale-[1.02]"
            >
              {/* Card Image */}
              <div className="relative aspect-[3/4] bg-gradient-to-br from-purple-900/50 to-blue-900/50">
                <Image
                  src={imageUrl}
                  alt={card.name}
                  fill
                  className="object-contain p-2"
                  unoptimized
                  onError={(e) => {
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

                {/* Profit Margin Badge */}
                {card.usPrice && lowestData?.price && (
                  <div className="absolute top-2 right-2">
                    <div
                      className={`px-3 py-1.5 rounded-lg font-bold text-sm shadow-lg ${
                        usProfitMargin > 100
                          ? 'bg-emerald-500 text-white'
                          : usProfitMargin > 50
                            ? 'bg-green-500 text-white'
                            : usProfitMargin > 20
                              ? 'bg-yellow-500 text-black'
                              : 'bg-red-500 text-white'
                      }`}
                    >
                      +{usProfitMargin}%
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 space-y-3">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white">{card.name}</h3>
                    <p className="text-sm text-purple-200">
                      {card.set} #{card.cardNumber}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-bold ${rarityBadgeClass(card.rarity)}`}>
                    {card.rarity}
                  </span>
                </div>

                {/* Lowest A-/B Price */}
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/60 text-sm">Lowest (A- / B)</p>
                  {lowestData?.price ? (
                    <>
                      <p className="text-2xl font-bold text-emerald-400">¥{lowestData.lowestPriceJPY.toLocaleString()}</p>
                      <p className="text-white/50 text-sm">
                        ~${lowestData.lowestPriceUSD.toFixed(2)}
                        {!lowestData.inStock && <span className="ml-2 text-red-400 font-semibold">Out of Stock</span>}
                      </p>
                      <p className="text-white/40 text-xs mt-1">Quality: {String(lowestData.price.quality)}</p>
                    </>
                  ) : (
                    <p className="text-red-400 text-sm">No A- or B listings found</p>
                  )}
                </div>

                {/* US Market */}
                {card.usPrice && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-blue-300 text-sm">TCGPlayer Market</p>
                      {lowestData?.price && (
                        <p
                          className={`text-lg font-bold ${
                            usProfitMargin > 50
                              ? 'text-emerald-400'
                              : usProfitMargin > 20
                                ? 'text-yellow-400'
                                : 'text-red-400'
                          }`}
                        >
                          +{usProfitMargin}%
                        </p>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xl font-bold text-white">${card.usPrice.marketPrice.toFixed(2)}</p>
                      <p className="text-white/50 text-xs">{card.usPrice.sellerCount} sellers</p>
                    </div>
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
                      <span className="text-emerald-300 text-sm font-semibold">TCGPlayer</span>
                      <span className="text-emerald-400 text-xs">View →</span>
                    </a>
                  )}

                  <div className="bg-white/5 rounded-lg p-3 border border-blue-500/20">
                    <p className="text-blue-300 text-sm mb-2">Japan-Toreca</p>
                    <div className="space-y-2">
                      {jtByQuality.map(({ q, price, inStock }) => {
                        if (!price) {
                          return (
                            <div key={q} className="flex justify-between items-center text-white/50 text-sm">
                              <span>Condition {q}</span>
                              <span>Not found</span>
                            </div>
                          );
                        }

                        return (
                          <a
                            key={q}
                            href={price.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex justify-between items-center rounded-lg px-3 py-2 transition ${
                              inStock
                                ? 'bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30'
                                : 'bg-gray-600/20 border border-gray-500/30 opacity-70'
                            }`}
                          >
                            <span className="text-white/80 text-sm">Condition {q}</span>
                            <span className="text-white font-semibold">
                              ¥{price.priceJPY.toLocaleString()}
                              {!inStock && <span className="ml-2 text-red-400 text-xs">OOS</span>}
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
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
