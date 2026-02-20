import { JapaneseCondition, JapanesePrice } from '@/lib/types';

export function normalizeQuality(q: unknown): JapaneseCondition | null {
  const quality = String(q || '').toUpperCase().replace('－', '-');
  if (quality === 'A-') return 'A-';
  if (quality === 'B') return 'B';
  // Toretoku sometimes gives "A"; treat as A-
  if (quality === 'A') return 'A-';
  return null;
}

// Filter prices to only include supported sources and A-/B qualities
export function filterQualityPrices(prices: JapanesePrice[], sources: Set<string>): JapanesePrice[] {
  return prices.filter((p) => sources.has(p.source) && normalizeQuality(p.quality) !== null);
}

export function getBaselinePrice(prices: JapanesePrice[], sources: Set<string>): {
  price: JapanesePrice | null;
  inStock: boolean;
  lowestPriceJPY: number;
  lowestPriceUSD: number;
  baselineQuality: JapaneseCondition | null;
} {
  const filteredPrices = filterQualityPrices(prices, sources);

  if (filteredPrices.length === 0) {
    return { price: null, inStock: false, lowestPriceJPY: 0, lowestPriceUSD: 0, baselineQuality: null };
  }

  // Prefer IN-STOCK over out-of-stock, even if that means taking B over A-.
  // Policy:
  // 1) in-stock A- (cheapest)
  // 2) in-stock B  (cheapest)
  // 3) OOS A-      (cheapest)
  // 4) OOS B       (cheapest)
  const aMinus = filteredPrices
    .filter((p) => normalizeQuality(p.quality) === 'A-')
    .sort((a, b) => a.priceJPY - b.priceJPY);
  const b = filteredPrices
    .filter((p) => normalizeQuality(p.quality) === 'B')
    .sort((a, b) => a.priceJPY - b.priceJPY);

  const pick = (arr: JapanesePrice[], quality: JapaneseCondition, wantInStock: boolean) => {
    const xs = wantInStock ? arr.filter((p) => p.inStock) : arr.filter((p) => !p.inStock);
    if (xs.length === 0) return null;
    return { price: xs[0], inStock: wantInStock, quality };
  };

  const chosen =
    pick(aMinus, 'A-', true) ||
    pick(b, 'B', true) ||
    pick(aMinus, 'A-', false) ||
    pick(b, 'B', false);

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

export function getBestPriceForQuality(
  prices: JapanesePrice[],
  quality: JapaneseCondition,
  sources: Set<string>
): {
  price: JapanesePrice | null;
  inStock: boolean;
} {
  const candidates = prices
    .filter((p) => sources.has(p.source) && normalizeQuality(p.quality) === quality)
    .sort((a, b) => a.priceJPY - b.priceJPY);

  if (candidates.length === 0) return { price: null, inStock: false };

  const inStock = candidates.filter((p) => p.inStock);
  if (inStock.length > 0) return { price: inStock[0], inStock: true };
  return { price: candidates[0], inStock: false };
}
