'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { ArbitrageOpportunity, JapanesePrice, JapaneseCondition, RarityCode } from '@/lib/types';
import {
  applyFilters,
  computeProfitMarginPercent,
  DEFAULT_FILTERS,
  Era,
  FilterState,
  MarginBucket,
  normalizeSetCode,
} from '@/lib/filters';

interface CardsWithFiltersProps {
  initialCards: ArbitrageOpportunity[];
  totalCards: number;
  viableOpportunities?: number;
  avgMargin?: number;
  lastUpdated?: string;
}

const TRACKED_SET = 'Multi-set (select sets below)';
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

function getBaselinePrice(prices: JapanesePrice[]): {
  price: JapanesePrice | null;
  inStock: boolean;
  lowestPriceJPY: number;
  lowestPriceUSD: number;
  baselineQuality: JapaneseCondition | null;
} {
  const filteredPrices = filterQualityPrices(prices);

  if (filteredPrices.length === 0) {
    return { price: null, inStock: false, lowestPriceJPY: 0, lowestPriceUSD: 0, baselineQuality: null };
  }

  // Prefer A- for baseline; fall back to B.
  const aMinus = filteredPrices
    .filter((p) => normalizeQuality(p.quality) === 'A-')
    .sort((a, b) => a.priceJPY - b.priceJPY);
  const b = filteredPrices
    .filter((p) => normalizeQuality(p.quality) === 'B')
    .sort((a, b) => a.priceJPY - b.priceJPY);

  const pick = (arr: JapanesePrice[], quality: JapaneseCondition) => {
    if (arr.length === 0) return null;
    const inStock = arr.filter((p) => p.inStock);
    if (inStock.length > 0) return { price: inStock[0], inStock: true, quality };
    return { price: arr[0], inStock: false, quality };
  };

  const chosen = pick(aMinus, 'A-') || pick(b, 'B');
  if (!chosen) {
    return { price: null, inStock: false, lowestPriceJPY: 0, lowestPriceUSD: 0, baselineQuality: null };
  }

  return {
    price: chosen.price,
    inStock: chosen.inStock,
    lowestPriceJPY: chosen.price.priceJPY,
    lowestPriceUSD: chosen.price.priceUSD,
    baselineQuality: chosen.quality,
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
  lowestData: ReturnType<typeof getBaselinePrice>;
  usProfitMargin: number;
};

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

export function CardsWithFilters({ initialCards, lastUpdated }: CardsWithFiltersProps) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState<string>('profit-desc');

  const allSets = useMemo<string[]>(() => {
    return Array.from(new Set(initialCards.map((c) => normalizeSetCode(c.set)))).sort();
  }, [initialCards]);

  const cardsWithData = useMemo<ComputedCard[]>(() => {
    return initialCards.map((card) => {
      const lowestData = getBaselinePrice(card.japanesePrices);
      const usProfitMargin = computeProfitMarginPercent(card);

      return {
        ...card,
        lowestData,
        usProfitMargin,
      };
    });
  }, [initialCards]);

  const filteredCards = useMemo<ComputedCard[]>(() => {
    // 1) Filter
    let cards = applyFilters(cardsWithData, filters);

    // 2) Sort
    cards = [...cards].sort((a, b) => {
      if (sortBy === 'profit-desc') return b.usProfitMargin - a.usProfitMargin;
      if (sortBy === 'profit-asc') return a.usProfitMargin - b.usProfitMargin;
      if (sortBy === 'price-asc') return a.lowestData.lowestPriceJPY - b.lowestData.lowestPriceJPY;
      if (sortBy === 'price-desc') return b.lowestData.lowestPriceJPY - a.lowestData.lowestPriceJPY;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

    return cards;
  }, [cardsWithData, filters, sortBy]);

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
      <div className="bg-white/5 backdrop-blur-md rounded-lg p-4 mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-white/75 text-sm block mb-1">Search</label>
            <input
              type="text"
              placeholder="Card name or number..."
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-white/75 text-sm block mb-1">Era</label>
            <select
              value={filters.era}
              onChange={(e) => setFilters((f) => ({ ...f, era: e.target.value as Era }))}
              className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="ALL" className="bg-gray-900">
                All eras
              </option>
              <option value="SV" className="bg-gray-900">
                SV (Scarlet/Violet)
              </option>
              <option value="S" className="bg-gray-900">
                S (Sword/Shield)
              </option>
              <option value="M" className="bg-gray-900">
                M (older)
              </option>
            </select>
          </div>

          <div>
            <label className="text-white/75 text-sm block mb-1">Rarity</label>
            <select
              value={filters.rarity}
              onChange={(e) => setFilters((f) => ({ ...f, rarity: e.target.value }))}
              className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all" className="bg-gray-900">
                All rarities
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-white/75 text-sm block mb-1">JP Baseline Price (JPY)</label>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="numeric"
                placeholder="Min ¥"
                value={filters.jpPriceJPY.min ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    jpPriceJPY: { ...f.jpPriceJPY, min: e.target.value === '' ? null : Number(e.target.value) },
                  }))
                }
                className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-purple-500"
              />
              <input
                type="number"
                inputMode="numeric"
                placeholder="Max ¥"
                value={filters.jpPriceJPY.max ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    jpPriceJPY: { ...f.jpPriceJPY, max: e.target.value === '' ? null : Number(e.target.value) },
                  }))
                }
                className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-purple-500"
              />
            </div>
            <p className="text-xs text-white/40 mt-1">Baseline = A- preferred, else B</p>
          </div>

          <div>
            <label className="text-white/75 text-sm block mb-1">Profit Margin Buckets</label>
            <div className="flex flex-wrap gap-2">
              {(['0-20', '20-40', '40-60', '60+'] as MarginBucket[]).map((b) => (
                <button
                  key={b}
                  onClick={() => setFilters((f) => ({ ...f, marginBuckets: toggleInList(f.marginBuckets, b) as MarginBucket[] }))}
                  className={`px-3 py-2 rounded border text-sm transition ${
                    filters.marginBuckets.includes(b)
                      ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-200'
                      : 'bg-white/10 border-white/20 text-white/70 hover:border-purple-500/50'
                  }`}
                  type="button"
                >
                  {b}%
                </button>
              ))}
            </div>
            <p className="text-xs text-white/40 mt-1">Uses conservative margin (worst A-/B buy price)</p>
          </div>

          <div>
            <label className="text-white/75 text-sm block mb-1">Sets (Include / Exclude)</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-white/50 mb-1">Include (if any selected)</p>
                <select
                  multiple
                  value={filters.includeSets}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions).map((o) => normalizeSetCode(o.value));
                    setFilters((f) => ({ ...f, includeSets: values }));
                  }}
                  className="w-full h-28 px-3 py-2 rounded bg-white/10 border border-white/20 text-white focus:outline-none focus:border-purple-500"
                >
                  {allSets.map((s) => (
                    <option key={s} value={s} className="bg-gray-900">
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-xs text-white/50 mb-1">Exclude</p>
                <select
                  multiple
                  value={filters.excludeSets}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions).map((o) => normalizeSetCode(o.value));
                    setFilters((f) => ({ ...f, excludeSets: values }));
                  }}
                  className="w-full h-28 px-3 py-2 rounded bg-white/10 border border-white/20 text-white focus:outline-none focus:border-purple-500"
                >
                  {allSets.map((s) => (
                    <option key={s} value={s} className="bg-gray-900">
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="px-3 py-2 rounded bg-purple-600 hover:bg-purple-500 text-white text-sm"
              >
                Reset filters
              </button>
              <button
                type="button"
                onClick={() => setFilters((f) => ({ ...f, includeSets: [], excludeSets: [] }))}
                className="px-3 py-2 rounded bg-white/10 hover:bg-white/15 border border-white/20 text-white/80 text-sm"
              >
                Clear set selections
              </button>
            </div>
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

                {/* Baseline JP Price */}
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/60 text-sm">Baseline (A- preferred, else B)</p>
                  {lowestData?.price ? (
                    <>
                      <p className="text-2xl font-bold text-emerald-400">¥{lowestData.lowestPriceJPY.toLocaleString()}</p>
                      <p className="text-white/50 text-sm">
                        ~${lowestData.lowestPriceUSD.toFixed(2)}
                        {!lowestData.inStock && <span className="ml-2 text-red-400 font-semibold">Out of Stock</span>}
                      </p>
                      <p className="text-white/40 text-xs mt-1">
                        Using: {lowestData.baselineQuality || String(lowestData.price.quality)}
                      </p>
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
              setFilters(DEFAULT_FILTERS);
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
