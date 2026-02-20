import { ArbitrageOpportunity, JapaneseCondition, JapanesePrice } from '@/lib/types';

export type Era = 'ALL' | 'SV' | 'S' | 'SM' | 'M';

export type MarginBucket = '0-20' | '20-40' | '40-60' | '60+';

export type FilterState = {
  search: string;

  // JP baseline price range (JPY)
  jpPriceJPY: { min: number | null; max: number | null };

  // Availability
  inStockOnly: boolean;

  // Set filtering
  era: Era;
  includeSets: string[]; // if non-empty, only these sets
  excludeSets: string[]; // always excluded

  // Profit filtering (computed from card.usPrice marketPrice and JP baseline)
  marginBuckets: MarginBucket[]; // empty => no filter

  // Existing filters
  rarity: string; // 'all' | RarityCode
};

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  jpPriceJPY: { min: null, max: null },
  inStockOnly: false,
  era: 'ALL',
  includeSets: [],
  excludeSets: [],
  marginBuckets: [],
  rarity: 'all',
};

export function normalizeSetCode(s: string): string {
  return String(s || '').trim().toUpperCase();
}

export function getEra(setCode: string): 'SV' | 'S' | 'SM' | 'M' | 'OTHER' {
  const s = normalizeSetCode(setCode);
  if (s.startsWith('SV')) return 'SV';
  // IMPORTANT: check SM before S so Sun & Moon doesn't get misclassified.
  if (s.startsWith('SM')) return 'SM';
  if (s.startsWith('S')) return 'S';
  if (s.startsWith('M')) return 'M';
  return 'OTHER';
}

export function normalizeQuality(q: unknown): JapaneseCondition | null {
  const quality = String(q || '').toUpperCase().replace('－', '-');
  if (quality === 'A-') return 'A-';
  if (quality === 'B') return 'B';
  return null;
}

export function filterQualityPrices(prices: JapanesePrice[], sources?: Set<string>): JapanesePrice[] {
  const allowed = sources && sources.size > 0 ? sources : new Set<string>(['japan-toreca']);
  return prices.filter((p) => allowed.has(p.source) && normalizeQuality(p.quality) !== null);
}

export function getBaselineJapanPrice(prices: JapanesePrice[], sources?: Set<string>): {
  price: JapanesePrice | null;
  baselineQuality: JapaneseCondition | null;
} {
  const filtered = filterQualityPrices(prices, sources);
  if (filtered.length === 0) return { price: null, baselineQuality: null };

  const aMinus = filtered
    .filter((p) => normalizeQuality(p.quality) === 'A-')
    .sort((a, b) => a.priceJPY - b.priceJPY);
  const b = filtered.filter((p) => normalizeQuality(p.quality) === 'B').sort((a, b) => a.priceJPY - b.priceJPY);

  const pick = (arr: JapanesePrice[], quality: JapaneseCondition, wantInStock: boolean) => {
    const xs = wantInStock ? arr.filter((p) => p.inStock) : arr.filter((p) => !p.inStock);
    if (xs.length === 0) return null;
    return { price: xs[0], quality };
  };

  // in-stock B beats out-of-stock A-
  const chosen =
    pick(aMinus, 'A-', true) ||
    pick(b, 'B', true) ||
    pick(aMinus, 'A-', false) ||
    pick(b, 'B', false);

  return chosen ? { price: chosen.price, baselineQuality: chosen.quality } : { price: null, baselineQuality: null };
}

export function computeProfitMarginPercent(card: ArbitrageOpportunity, sources?: Set<string>): number {
  // Conservative: use the WORST (highest) priceUSD among A-/B (in-stock preferred) when computing margin.
  if (!card.usPrice) return 0;

  const jpPrices = filterQualityPrices(card.japanesePrices, sources);
  if (jpPrices.length === 0) return 0;

  const inStock = jpPrices.filter((p) => p.inStock);
  const candidates = inStock.length > 0 ? inStock : jpPrices;

  const worst = candidates.reduce((max, p) => (p.priceUSD > max.priceUSD ? p : max), candidates[0]);
  if (!worst || worst.priceUSD <= 0) return 0;

  return Math.round(((card.usPrice.marketPrice - worst.priceUSD) / worst.priceUSD) * 100);
}

export function marginBucket(m: number): MarginBucket {
  if (m < 20) return '0-20';
  if (m < 40) return '20-40';
  if (m < 60) return '40-60';
  return '60+';
}

export function applyFilters<T extends ArbitrageOpportunity>(
  cards: T[],
  state: FilterState,
  opts?: { jpSources?: Set<string> }
): T[] {
  const search = state.search.trim().toLowerCase();

  const include = new Set(state.includeSets.map(normalizeSetCode));
  const exclude = new Set(state.excludeSets.map(normalizeSetCode));

  return cards.filter((card) => {
    const set = normalizeSetCode(card.set);

    // era filter
    if (state.era !== 'ALL') {
      if (getEra(set) !== state.era) return false;
    }

    // exclude / include sets
    if (exclude.has(set)) return false;
    if (include.size > 0 && !include.has(set)) return false;

    // rarity
    if (state.rarity !== 'all' && card.rarity !== state.rarity) return false;

    // search
    if (search) {
      const name = String(card.name || '').toLowerCase();
      const num = String(card.cardNumber || '').toLowerCase();
      if (!name.includes(search) && !num.includes(search)) return false;
    }

    // Availability filter: in-stock in at least one selected JP source (A-/B)
    if (state.inStockOnly) {
      const jp = filterQualityPrices(card.japanesePrices, opts?.jpSources);
      const hasInStock = jp.some((p) => p.inStock);
      if (!hasInStock) return false;
    }

    // price range (JPY) uses baseline (A-/B; in-stock preferred)
    const baseline = getBaselineJapanPrice(card.japanesePrices, opts?.jpSources).price;
    const jp = baseline?.priceJPY ?? null;
    if (jp == null) return false;

    if (state.jpPriceJPY.min != null && jp < state.jpPriceJPY.min) return false;
    if (state.jpPriceJPY.max != null && jp > state.jpPriceJPY.max) return false;

    // margin buckets
    if (state.marginBuckets.length > 0) {
      const m = computeProfitMarginPercent(card, opts?.jpSources);
      const b = marginBucket(m);
      if (!state.marginBuckets.includes(b)) return false;
    }

    return true;
  });
}
