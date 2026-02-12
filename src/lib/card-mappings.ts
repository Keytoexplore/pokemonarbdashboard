// Mapping between Japanese and English card data
// This allows us to lookup TCGPlayer prices for Japanese cards

export interface CardMapping {
  japaneseName: string;
  englishName: string;
  cardNumber: string;
  set: {
    japanese: string;
    english: string;
  };
  rarity: 'SR' | 'AR' | 'SAR';
}

// M3 Set (Paradigm Trigger) mappings
export const M3_MAPPINGS: CardMapping[] = [
  { japaneseName: 'ラッタ', englishName: 'Raticate', cardNumber: '092/080', set: { japanese: 'M3', english: 'Paradigm Trigger' }, rarity: 'AR' },
  { japaneseName: 'ドラピオン', englishName: 'Drapion', cardNumber: '090/080', set: { japanese: 'M3', english: 'Paradigm Trigger' }, rarity: 'AR' },
  { japaneseName: 'ニダンギル', englishName: 'Doublade', cardNumber: '091/080', set: { japanese: 'M3', english: 'Paradigm Trigger' }, rarity: 'AR' },
  { japaneseName: 'チゴラス', englishName: 'Tyrunt', cardNumber: '089/080', set: { japanese: 'M3', english: 'Paradigm Trigger' }, rarity: 'AR' },
  { japaneseName: 'パフュートン', englishName: 'Oinkologne', cardNumber: '086/080', set: { japanese: 'M3', english: 'Paradigm Trigger' }, rarity: 'AR' },
  { japaneseName: 'サーナイト', englishName: 'Gardevoir', cardNumber: '087/080', set: { japanese: 'M3', english: 'Paradigm Trigger' }, rarity: 'AR' },
  { japaneseName: 'イーブイ', englishName: 'Eevee', cardNumber: '088/080', set: { japanese: 'M3', english: 'Paradigm Trigger' }, rarity: 'AR' },
  
  // SR Cards
  { japaneseName: 'デカヌチャン', englishName: 'Tinkaton', cardNumber: '098/080', set: { japanese: 'M3', english: 'Paradigm Trigger' }, rarity: 'SR' },
  { japaneseName: 'クエスパトラ', englishName: 'Espathra', cardNumber: '099/080', set: { japanese: 'M3', english: 'Paradigm Trigger' }, rarity: 'SR' },
  { japaneseName: 'ハルクジラ', englishName: 'Cetitan', cardNumber: '100/080', set: { japanese: 'M3', english: 'Paradigm Trigger' }, rarity: 'SR' },
  { japaneseName: 'ミミズズ', englishName: 'Toedscruel', cardNumber: '101/080', set: { japanese: 'M3', english: 'Paradigm Trigger' }, rarity: 'SR' },
  { japaneseName: 'カラミンゴ', englishName: 'Flamigo', cardNumber: '102/080', set: { japanese: 'M3', english: 'Paradigm Trigger' }, rarity: 'SR' },
  { japaneseName: 'ヘイラッシャ', englishName: 'Dondozo', cardNumber: '103/080', set: { japanese: 'M3', english: 'Paradigm Trigger' }, rarity: 'SR' },
  { japaneseName: 'セグレイブ', englishName: 'Chien-Pao', cardNumber: '104/080', set: { japanese: 'M3', english: 'Paradigm Trigger' }, rarity: 'SR' },
  { japaneseName: 'チオンジェン', englishName: 'Ting-Lu', cardNumber: '105/080', set: { japanese: 'M3', english: 'Paradigm Trigger' }, rarity: 'SR' },
  { japaneseName: 'パオジアン', englishName: 'Chien-Pao', cardNumber: '106/080', set: { japanese: 'M3', english: 'Paradigm Trigger' }, rarity: 'SR' },
  { japaneseName: 'ディンルー', englishName: 'Ting-Lu', cardNumber: '107/080', set: { japanese: 'M3', english: 'Paradigm Trigger' }, rarity: 'SR' },
  { japaneseName: 'イイネイヌ', englishName: 'Mabosstiff', cardNumber: '108/080', set: { japanese: 'M3', english: 'Paradigm Trigger' }, rarity: 'SR' },
  { japaneseName: 'アラブルタケ', englishName: 'Brute Bonnet', cardNumber: '109/080', set: { japanese: 'M3', english: 'Paradigm Trigger' }, rarity: 'SR' },
  { japaneseName: 'ハバタクカミ', englishName: 'Flutter Mane', cardNumber: '110/080', set: { japanese: 'M3', english: 'Paradigm Trigger' }, rarity: 'SR' },
  
  // SAR Cards
  { japaneseName: 'ミミズズ', englishName: 'Toedscruel', cardNumber: '113/080', set: { japanese: 'M3', english: 'Paradigm Trigger' }, rarity: 'SAR' },
  { japaneseName: 'セグレイブ', englishName: 'Chien-Pao', cardNumber: '114/080', set: { japanese: 'M3', english: 'Paradigm Trigger' }, rarity: 'SAR' },
  { japaneseName: 'パオジアン', englishName: 'Chien-Pao', cardNumber: '115/080', set: { japanese: 'M3', english: 'Paradigm Trigger' }, rarity: 'SAR' },
  { japaneseName: 'イイネイヌ', englishName: 'Mabosstiff', cardNumber: '116/080', set: { japanese: 'M3', english: 'Paradigm Trigger' }, rarity: 'SAR' },
  { japaneseName: 'ハバタクカミ', englishName: 'Flutter Mane', cardNumber: '117/080', set: { japanese: 'M3', english: 'Paradigm Trigger' }, rarity: 'SAR' },
];

// Create lookup maps
const japaneseToEnglishMap = new Map<string, CardMapping>();
const cardNumberToMappingMap = new Map<string, CardMapping>();

// Build lookup maps from all mappings
[M3_MAPPINGS].flat().forEach(mapping => {
  const key = `${mapping.set.japanese}-${mapping.japaneseName}-${mapping.cardNumber}`;
  japaneseToEnglishMap.set(key, mapping);
  cardNumberToMappingMap.set(`${mapping.set.japanese}-${mapping.cardNumber}`, mapping);
});

export function getEnglishCardName(japaneseName: string, cardNumber: string, set: string): string | null {
  const key = `${set}-${japaneseName}-${cardNumber}`;
  const mapping = japaneseToEnglishMap.get(key);
  return mapping?.englishName || null;
}

export function getCardMapping(cardNumber: string, set: string): CardMapping | null {
  const key = `${set}-${cardNumber}`;
  return cardNumberToMappingMap.get(key) || null;
}

export function getAllMappingsForSet(set: string): CardMapping[] {
  return [M3_MAPPINGS].flat().filter(m => m.set.japanese === set);
}