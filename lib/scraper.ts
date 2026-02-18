import { scrapeJapanTorecaSearchPage, JapanTorecaCardListing } from './scrapers';

/**
 * Lightweight Japan-Toreca scraper used by scripts.
 *
 * Note: This repo intentionally no longer supports TorecaCamp.
 * We scrape only **Japan-Toreca** listings and only the rarities/conditions
 * that are relevant for the dashboard.
 */
export async function scrapeJapanTorecaForSet(
  setCode: string,
  rarities: string[],
  opts?: { maxPagesPerRarity?: number; delayMs?: number }
): Promise<JapanTorecaCardListing[]> {
  const maxPagesPerRarity = opts?.maxPagesPerRarity ?? 10;
  const delayMs = opts?.delayMs ?? 700;

  const out: JapanTorecaCardListing[] = [];

  for (const rarity of rarities) {
    for (let page = 1; page <= maxPagesPerRarity; page++) {
      const q = `${setCode.toLowerCase()}+${rarity.toLowerCase()}`;
      const url = page === 1
        ? `https://shop.japan-toreca.com/search?q=${q}`
        : `https://shop.japan-toreca.com/search?q=${q}&page=${page}`;

      const listings = await scrapeJapanTorecaSearchPage(url);
      if (listings.length === 0) break;

      out.push(...listings);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return out;
}
