import { CardsWithFilters } from '@/components/CardsWithFilters';
import { DashboardData } from '@/lib/types';

// Revalidate every 3 days
export const revalidate = 259200;

// Embedded card data
const cardsData: DashboardData = {
  "opportunities": [
    {"id":"M3-104/080-SAR","name":"ワンダーパッチ","cardNumber":"104/080","rarity":"SAR","set":"M3","tcgplayer":{"marketPrice":0,"sellerCount":0},"japanesePrices":[{"source":"japan-toreca","priceJPY":450,"priceUSD":2.93,"quality":"A","inStock":true,"url":"https://shop.japan-toreca.com/products/pokemon-227755-a","isLowest":false},{"source":"japan-toreca","priceJPY":200,"priceUSD":1.3,"quality":"A-","inStock":true,"url":"https://shop.japan-toreca.com/products/pokemon-227755-a-damaged","isLowest":true}],"lowestJapanesePrice":1.3,"marginPercent":0,"marginAmount":0,"lastUpdated":"2026-02-12T17:53:00Z","isViable":false},
    {"id":"M3-105/080-SAR","name":"タラゴン","cardNumber":"105/080","rarity":"SAR","set":"M3","tcgplayer":{"marketPrice":0,"sellerCount":0},"japanesePrices":[{"source":"japan-toreca","priceJPY":350,"priceUSD":2.28,"quality":"A","inStock":true,"url":"https://shop.japan-toreca.com/products/pokemon-227756-a","isLowest":true},{"source":"torecacamp","priceJPY":380,"priceUSD":2.48,"quality":null,"inStock":true,"url":"https://torecacamp-pokemon.com/products/rc_jt822gt7wb8w_g8qe","isLowest":false}],"lowestJapanesePrice":2.28,"marginPercent":0,"marginAmount":0,"lastUpdated":"2026-02-12T17:53:00Z","isViable":false},
    {"id":"M3-106/080-SAR","name":"ピュール","cardNumber":"106/080","rarity":"SAR","set":"M3","tcgplayer":{"marketPrice":0,"sellerCount":0},"japanesePrices":[{"source":"japan-toreca","priceJPY":800,"priceUSD":5.2,"quality":"A","inStock":true,"url":"https://shop.japan-toreca.com/products/pokemon-227757-a","isLowest":true}],"lowestJapanesePrice":5.2,"marginPercent":0,"marginAmount":0,"lastUpdated":"2026-02-12T17:53:00Z","isViable":false},
    {"id":"M3-108/080-SAR","name":"ユカリ","cardNumber":"108/080","rarity":"SAR","set":"M3","tcgplayer":{"marketPrice":0,"sellerCount":0},"japanesePrices":[{"source":"japan-toreca","priceJPY":650,"priceUSD":4.23,"quality":"A","inStock":true,"url":"https://shop.japan-toreca.com/products/pokemon-227759-a","isLowest":true},{"source":"japan-toreca","priceJPY":550,"priceUSD":3.58,"quality":"A-","inStock":true,"url":"https://shop.japan-toreca.com/products/pokemon-227759-a-damaged","isLowest":false}],"lowestJapanesePrice":3.58,"marginPercent":0,"marginAmount":0,"lastUpdated":"2026-02-12T17:53:00Z","isViable":false},
    {"id":"M3-110/080-SAR","name":"ミアレシティ","cardNumber":"110/080","rarity":"SAR","set":"M3","tcgplayer":{"marketPrice":0,"sellerCount":0},"japanesePrices":[{"source":"japan-toreca","priceJPY":150,"priceUSD":0.98,"quality":"A","inStock":true,"url":"https://shop.japan-toreca.com/products/pokemon-227761-a","isLowest":false},{"source":"torecacamp","priceJPY":100,"priceUSD":0.65,"quality":null,"inStock":true,"url":"https://torecacamp-pokemon.com/products/rc_it822gt7wb8w_g8qe","isLowest":true}],"lowestJapanesePrice":0.65,"marginPercent":0,"marginAmount":0,"lastUpdated":"2026-02-12T17:53:00Z","isViable":false},
    {"id":"M3-098/080-SR","name":"イベルタルex","cardNumber":"098/080","rarity":"SR","set":"M3","tcgplayer":{"marketPrice":0,"sellerCount":0},"japanesePrices":[{"source":"japan-toreca","priceJPY":500,"priceUSD":3.25,"quality":"A-","inStock":true,"url":"https://shop.japan-toreca.com/products/pokemon-227749-a-damaged","isLowest":true},{"source":"japan-toreca","priceJPY":700,"priceUSD":4.55,"quality":"A","inStock":true,"url":"https://shop.japan-toreca.com/products/pokemon-227749-a","isLowest":false}],"lowestJapanesePrice":3.25,"marginPercent":0,"marginAmount":0,"lastUpdated":"2026-02-12T17:53:00Z","isViable":false},
    {"id":"M3-101/080-SR","name":"エネルギーリサイクル","cardNumber":"101/080","rarity":"SR","set":"M3","tcgplayer":{"marketPrice":0,"sellerCount":0},"japanesePrices":[{"source":"japan-toreca","priceJPY":200,"priceUSD":1.3,"quality":"A","inStock":true,"url":"https://shop.japan-toreca.com/products/pokemon-227752-a","isLowest":false},{"source":"torecacamp","priceJPY":100,"priceUSD":0.65,"quality":null,"inStock":false,"url":"https://torecacamp-pokemon.com/products/rc_123","isLowest":true}],"lowestJapanesePrice":0.65,"marginPercent":0,"marginAmount":0,"lastUpdated":"2026-02-12T17:53:00Z","isViable":false},
    {"id":"M3-092/080-AR","name":"ラッタ","cardNumber":"092/080","rarity":"AR","set":"M3","tcgplayer":{"marketPrice":0,"sellerCount":0},"japanesePrices":[{"source":"japan-toreca","priceJPY":400,"priceUSD":2.6,"quality":"A-","inStock":true,"url":"https://shop.japan-toreca.com/products/pokemon-227743-a-damaged","isLowest":true}],"lowestJapanesePrice":2.6,"marginPercent":0,"marginAmount":0,"lastUpdated":"2026-02-12T17:53:00Z","isViable":false},
    {"id":"M3-089/080-AR","name":"チゴラス","cardNumber":"089/080","rarity":"AR","set":"M3","tcgplayer":{"marketPrice":0,"sellerCount":0},"japanesePrices":[{"source":"japan-toreca","priceJPY":500,"priceUSD":3.25,"quality":"A-","inStock":true,"url":"https://shop.japan-toreca.com/products/pokemon-227740-a-damaged","isLowest":true}],"lowestJapanesePrice":3.25,"marginPercent":0,"marginAmount":0,"lastUpdated":"2026-02-12T17:53:00Z","isViable":false},
    {"id":"M3-090/080-AR","name":"ドラピオン","cardNumber":"090/080","rarity":"AR","set":"M3","tcgplayer":{"marketPrice":0,"sellerCount":0},"japanesePrices":[{"source":"japan-toreca","priceJPY":250,"priceUSD":1.63,"quality":"B","inStock":true,"url":"https://shop.japan-toreca.com/products/pokemon-227741-b","isLowest":true}],"lowestJapanesePrice":1.63,"marginPercent":0,"marginAmount":0,"lastUpdated":"2026-02-12T17:53:00Z","isViable":false}
  ],
  "lastUpdated": "2026-02-12T17:53:00Z",
  "stats": { "totalCards": 10, "viableOpportunities": 0, "avgMargin": 0 }
};

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Pokemon TCG Arbitrage
          </h1>
          <p className="text-purple-200">
            Japanese M3 Set - SAR, AR & SR Price Tracker
          </p>
        </div>

        <CardsWithFilters 
          initialCards={cardsData.opportunities} 
          totalCards={cardsData.stats.totalCards} 
        />
      </div>
    </main>
  );
}