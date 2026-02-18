import { ArbitrageOpportunity } from './types';

/**
 * Fallback dataset used only if data/prices.json is missing.
 *
 * This repo is configured to track **S12a** only.
 * Generate the real dataset by running:
 *   npm run build:s12a
 */
export const baseCardsData: ArbitrageOpportunity[] = [];
