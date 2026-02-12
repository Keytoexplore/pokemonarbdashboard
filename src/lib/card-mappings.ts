// Mapping between Japanese and English card data
// This allows us to lookup TCGPlayer prices for Japanese cards
// 
// Key insight: Japanese M3 (Paradigm Trigger) cards map to English Silver Tempest set
// Japanese card numbers (e.g., 098/080) are SECRET RARES beyond the base set
// English Silver Tempest uses /195 pattern

export interface CardMapping {
  japaneseName: string;
  japaneseCardNumber: string;
  englishName: string;
  englishCardNumber: string;
  set: {
    japanese: string;
    english: string;
  };
  rarity: 'SR' | 'AR' | 'SAR' | 'UR';
  notes?: string;
}

// M3 Set (Paradigm Trigger) → Silver Tempest mappings
// AR cards are Japanese-exclusive Art Rares (not in English set)
export const M3_MAPPINGS: CardMapping[] = [
  // AR Cards (Japanese exclusive - not in English Silver Tempest)
  { japaneseName: 'パフュートン', japaneseCardNumber: '086/080', englishName: 'Oinkologne', englishCardNumber: 'N/A', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'AR', notes: 'Japanese exclusive Art Rare' },
  { japaneseName: 'サーナイト', japaneseCardNumber: '087/080', englishName: 'Gardevoir', englishCardNumber: '069/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'AR', notes: 'Regular rare in English' },
  { japaneseName: 'イーブイ', japaneseCardNumber: '088/080', englishName: 'Eevee', englishCardNumber: 'N/A', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'AR', notes: 'Japanese exclusive Art Rare' },
  { japaneseName: 'チゴラス', japaneseCardNumber: '089/080', englishName: 'Tyrunt', englishCardNumber: 'N/A', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'AR', notes: 'Not in Silver Tempest' },
  { japaneseName: 'ドラピオン', japaneseCardNumber: '090/080', englishName: 'Drapion', englishCardNumber: 'N/A', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'AR', notes: 'Not in Silver Tempest' },
  { japaneseName: 'ニダンギル', japaneseCardNumber: '091/080', englishName: 'Doublade', englishCardNumber: 'N/A', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'AR', notes: 'Not in Silver Tempest' },
  { japaneseName: 'ラッタ', japaneseCardNumber: '092/080', englishName: 'Raticate', englishCardNumber: 'N/A', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'AR', notes: 'Not in Silver Tempest' },
  
  // V and VSTAR Cards (regular versions)
  { japaneseName: 'ハブネーク V', japaneseCardNumber: '009/098', englishName: 'Chesnaught V', englishCardNumber: '015/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SR' },
  { japaneseName: 'オムスター V', japaneseCardNumber: '018/098', englishName: 'Omastar V', englishCardNumber: '035/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SR' },
  { japaneseName: 'レジエレキ V', japaneseCardNumber: '033/098', englishName: 'Regieleki V', englishCardNumber: '057/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SR' },
  { japaneseName: 'レジエレキ VMAX', japaneseCardNumber: '034/098', englishName: 'Regieleki VMAX', englishCardNumber: '058/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SR' },
  { japaneseName: 'アンノーン V', japaneseCardNumber: '035/098', englishName: 'Unown V', englishCardNumber: '065/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SR' },
  { japaneseName: 'アンノーン VSTAR', japaneseCardNumber: '036/098', englishName: 'Unown VSTAR', englishCardNumber: '066/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SR' },
  { japaneseName: 'ヒスイウインディ V', japaneseCardNumber: '046/098', englishName: 'Hisuian Arcanine V', englishCardNumber: '090/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SR' },
  { japaneseName: 'スカタンク V', japaneseCardNumber: '056/098', englishName: 'Skuntank V', englishCardNumber: '108/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SR' },
  { japaneseName: 'レジドラゴ V', japaneseCardNumber: '076/098', englishName: 'Regidrago V', englishCardNumber: '135/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SR' },
  { japaneseName: 'レジドラゴ VSTAR', japaneseCardNumber: '077/098', englishName: 'Regidrago VSTAR', englishCardNumber: '136/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SR' },
  { japaneseName: 'ルギア V', japaneseCardNumber: '079/098', englishName: 'Lugia V', englishCardNumber: '138/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SR' },
  { japaneseName: 'ルギア VSTAR', japaneseCardNumber: '080/098', englishName: 'Lugia VSTAR', englishCardNumber: '139/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SR' },
  
  // Full Art Trainer Cards
  { japaneseName: 'ツワブキ', japaneseCardNumber: '094/098', englishName: 'Brandon', englishCardNumber: '151/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SR' },
  { japaneseName: 'スズナ', japaneseCardNumber: '095/098', englishName: 'Candice', englishCardNumber: '152/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SR' },
  { japaneseName: 'ワタル', japaneseCardNumber: '096/098', englishName: 'Lance', englishCardNumber: '159/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SR' },
  { japaneseName: 'はたらくおじさん', japaneseCardNumber: '093/098', englishName: 'Worker', englishCardNumber: '167/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SR' },
  
  // Ultra Rare Full Art V Cards (Secret Rares 099-110)
  { japaneseName: 'ハブネーク V', japaneseCardNumber: '099/098', englishName: 'Chesnaught V', englishCardNumber: '171/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SR', notes: 'Full Art' },
  { japaneseName: 'オムスター V', japaneseCardNumber: '100/098', englishName: 'Omastar V', englishCardNumber: '174/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SR', notes: 'Full Art' },
  { japaneseName: 'レジエレキ V', japaneseCardNumber: '101/098', englishName: 'Regieleki V', englishCardNumber: '175/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SR', notes: 'Full Art' },
  { japaneseName: 'アンノーン V', japaneseCardNumber: '102/098', englishName: 'Unown V', englishCardNumber: '176/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SR', notes: 'Full Art' },
  { japaneseName: 'アンノーン V', japaneseCardNumber: '103/098', englishName: 'Unown V', englishCardNumber: '177/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SR', notes: 'Alt Art' },
  { japaneseName: 'ヒスイウインディ V', japaneseCardNumber: '104/098', englishName: 'Hisuian Arcanine V', englishCardNumber: '179/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SR', notes: 'Full Art' },
  { japaneseName: 'スカタンク V', japaneseCardNumber: '105/098', englishName: 'Skuntank V', englishCardNumber: '180/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SR', notes: 'Full Art' },
  { japaneseName: 'スカタンク V', japaneseCardNumber: '106/098', englishName: 'Skuntank V', englishCardNumber: '181/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SR', notes: 'Alt Art' },
  { japaneseName: 'レジドラゴ V', japaneseCardNumber: '107/098', englishName: 'Regidrago V', englishCardNumber: '183/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SR', notes: 'Full Art' },
  { japaneseName: 'レジドラゴ V', japaneseCardNumber: '108/098', englishName: 'Regidrago V', englishCardNumber: '184/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SR', notes: 'Alt Art' },
  { japaneseName: 'ルギア V', japaneseCardNumber: '109/098', englishName: 'Lugia V', englishCardNumber: '185/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SR', notes: 'Full Art' },
  { japaneseName: 'ルギア V', japaneseCardNumber: '110/098', englishName: 'Lugia V', englishCardNumber: '186/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SR', notes: 'Alt Art - EXPENSIVE' },
  
  // Full Art Trainers (111-114)
  { japaneseName: 'はたらくおじさん', japaneseCardNumber: '111/098', englishName: 'Worker', englishCardNumber: '195/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SR', notes: 'Full Art' },
  { japaneseName: 'ツワブキ', japaneseCardNumber: '112/098', englishName: 'Brandon', englishCardNumber: '188/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SR', notes: 'Full Art' },
  { japaneseName: 'スズナ', japaneseCardNumber: '113/098', englishName: 'Candice', englishCardNumber: '189/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SR', notes: 'Full Art' },
  { japaneseName: 'ワタル', japaneseCardNumber: '114/098', englishName: 'Lance', englishCardNumber: '192/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SR', notes: 'Full Art' },
  
  // Rainbow Rare VMAX/VSTAR (115-118)
  { japaneseName: 'レジエレキ VMAX', japaneseCardNumber: '115/098', englishName: 'Regieleki VMAX', englishCardNumber: '198/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SAR', notes: 'Rainbow Rare' },
  { japaneseName: 'アンノーン VSTAR', japaneseCardNumber: '116/098', englishName: 'Unown VSTAR', englishCardNumber: '199/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SAR', notes: 'Rainbow Rare' },
  { japaneseName: 'レジドラゴ VSTAR', japaneseCardNumber: '117/098', englishName: 'Regidrago VSTAR', englishCardNumber: '201/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SAR', notes: 'Rainbow Rare' },
  { japaneseName: 'ルギア VSTAR', japaneseCardNumber: '118/098', englishName: 'Lugia VSTAR', englishCardNumber: '202/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SAR', notes: 'Rainbow Rare' },
  
  // Hyper Rare Trainers (119-122)
  { japaneseName: 'はたらくおじさん', japaneseCardNumber: '119/098', englishName: 'Worker', englishCardNumber: '209/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SAR', notes: 'Hyper Rare' },
  { japaneseName: 'ツワブキ', japaneseCardNumber: '120/098', englishName: 'Brandon', englishCardNumber: '203/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SAR', notes: 'Hyper Rare' },
  { japaneseName: 'スズナ', japaneseCardNumber: '121/098', englishName: 'Candice', englishCardNumber: '204/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SAR', notes: 'Hyper Rare' },
  { japaneseName: 'ワタル', japaneseCardNumber: '122/098', englishName: 'Lance', englishCardNumber: '206/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'SAR', notes: 'Hyper Rare' },
  
  // Gold Cards (123-125)
  { japaneseName: 'ルギア VSTAR', japaneseCardNumber: '123/098', englishName: 'Lugia VSTAR', englishCardNumber: '211/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'UR', notes: 'Gold' },
  { japaneseName: 'リーフィタウン', japaneseCardNumber: '124/098', englishName: 'Leafy Camo Poncho', englishCardNumber: '214/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'UR', notes: 'Gold' },
  { japaneseName: 'ガケガニの沼', japaneseCardNumber: '125/098', englishName: 'Gapejaw Bog', englishCardNumber: '213/195', set: { japanese: 'M3', english: 'Silver Tempest' }, rarity: 'UR', notes: 'Gold' },
];

// Create lookup maps
const japaneseToEnglishMap = new Map<string, CardMapping>();
const japaneseCardNumberMap = new Map<string, CardMapping>();

// Build lookup maps from all mappings
[M3_MAPPINGS].flat().forEach(mapping => {
  const key = `${mapping.set.japanese}-${mapping.japaneseName}-${mapping.japaneseCardNumber}`;
  japaneseToEnglishMap.set(key, mapping);
  japaneseCardNumberMap.set(`${mapping.set.japanese}-${mapping.japaneseCardNumber}`, mapping);
});

export function getEnglishCardName(japaneseName: string, cardNumber: string, set: string): string | null {
  const key = `${set}-${japaneseName}-${cardNumber}`;
  const mapping = japaneseToEnglishMap.get(key);
  return mapping?.englishName || null;
}

export function getCardMapping(japaneseCardNumber: string, set: string): CardMapping | null {
  const key = `${set}-${japaneseCardNumber}`;
  return japaneseCardNumberMap.get(key) || null;
}

export function getCardMappingByJapaneseName(japaneseName: string, set: string): CardMapping[] {
  return [M3_MAPPINGS].flat().filter(m => 
    m.set.japanese === set && m.japaneseName === japaneseName
  );
}

export function getAllMappingsForSet(set: string): CardMapping[] {
  return [M3_MAPPINGS].flat().filter(m => m.set.japanese === set);
}