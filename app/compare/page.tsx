import { CompareClient } from '@/components/CompareClient';
import { BuilderDashboardData, DashboardData } from '@/lib/types';
import { baseCardsData } from '@/lib/card-data';
import * as fs from 'fs';
import * as path from 'path';

export const revalidate = 259200; // 3 days

function getPricesData(): DashboardData {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'prices.json');

    if (fs.existsSync(dataPath)) {
      const fileContent = fs.readFileSync(dataPath, 'utf-8');
      const parsed = JSON.parse(fileContent);

      // Legacy dashboard format: { opportunities, lastUpdated, stats }
      if (Array.isArray(parsed?.opportunities) && parsed?.stats) {
        return parsed;
      }

      // Builder format: { meta, cards }
      if (Array.isArray(parsed?.cards) && parsed?.meta) {
        const builder = parsed as BuilderDashboardData;
        return {
          opportunities: [],
          lastUpdated: builder.meta.builtAt || new Date().toISOString(),
          stats: {
            totalCards: builder.cards.length,
            viableOpportunities: 0,
            avgMargin: 0,
          },
        };
      }
    }
  } catch (err) {
    console.error('[Compare] Error reading prices file:', err);
  }

  return {
    opportunities: baseCardsData,
    lastUpdated: new Date().toISOString(),
    stats: {
      totalCards: baseCardsData.length,
      viableOpportunities: 0,
      avgMargin: 0,
    },
  };
}

function getBuilderData(): BuilderDashboardData | null {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'prices.json');
    if (!fs.existsSync(dataPath)) return null;
    const parsed = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    if (Array.isArray(parsed?.cards) && parsed?.meta) return parsed as BuilderDashboardData;
  } catch (err) {
    console.error('[Compare] Error reading builder data:', err);
  }
  return null;
}

export default async function ComparePage() {
  const builder = getBuilderData();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-1">Compare JP Shops</h1>
          <p className="text-purple-200 text-sm">Compare A- / B prices per shop, with stock status and links.</p>
        </div>

        <CompareClient builder={builder} />
      </div>
    </main>
  );
}
