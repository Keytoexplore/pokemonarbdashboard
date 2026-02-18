'use client';

import { ArbitrageOpportunity, RarityCode } from '@/lib/types';

interface CardGridProps {
  cards: ArbitrageOpportunity[];
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

export function CardGrid({ cards }: CardGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card) => {
        const lowest = card.japanesePrices.find((p) => p.isLowest) || card.japanesePrices[0];
        const japanToreca = card.japanesePrices.find((p) => p.source === 'japan-toreca');

        return (
          <div
            key={card.id}
            className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-blue-500/50 transition"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-bold">{card.name}</h3>
              <span className={`text-xs px-2 py-1 rounded font-bold ${rarityBadgeClass(card.rarity)}`}>{card.rarity}</span>
            </div>

            <p className="text-gray-400 text-sm mb-4">
              {card.set} #{card.cardNumber}
            </p>

            {lowest && (
              <div className="mb-4">
                <p className="text-gray-400 text-sm">Lowest Price</p>
                <p className="text-3xl font-bold text-emerald-400">¥{lowest.priceJPY.toLocaleString()}</p>
                <p className="text-gray-500 text-sm">~${lowest.priceUSD.toFixed(2)}</p>
              </div>
            )}

            <div className="space-y-2">
              {japanToreca && (
                <a
                  href={japanToreca.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-blue-900/30 hover:bg-blue-900/50 border border-blue-700/50 rounded-lg px-4 py-3 transition"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-blue-400 text-sm">Japan-Toreca</span>
                    <span className="font-bold">¥{japanToreca.priceJPY.toLocaleString()}</span>
                  </div>
                  {japanToreca.quality && <span className="text-xs text-gray-400">Condition: {japanToreca.quality}</span>}
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
