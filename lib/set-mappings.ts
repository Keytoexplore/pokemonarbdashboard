// Japanese set code mappings to PokemonPriceTracker API set identifiers
// M3 = Nihil Zero, etc.

export interface SetMapping {
  jpCode: string;
  apiSetId: string;      // What the API expects
  englishName: string;
  japaneseName: string;
  releaseDate: string;
  englishEquivalent?: string;
}

export const japaneseSetMappings: Record<string, SetMapping> = {
  // M Series (Mega Evolution Era)
  'M1L': {
    jpCode: 'M1L',
    apiSetId: 'm1l',
    englishName: 'Magma Lava',
    japaneseName: 'マグマラバ',
    releaseDate: '2025-07-18',
  },
  'M1S': {
    jpCode: 'M1S',
    apiSetId: 'm1s',
    englishName: 'Magma Storm',
    japaneseName: 'マグマストーム',
    releaseDate: '2025-07-18',
  },
  'M3': {
    jpCode: 'M3',
    apiSetId: 'm3',  // CONFIRMED: API uses 'm3', not 'nihil-zero'
    englishName: 'Nihil Zero',
    japaneseName: 'ムニキスゼロ',
    releaseDate: '2026-01-23',
    englishEquivalent: 'Perfect Order',
  },
  'M2a': {
    jpCode: 'M2a',
    apiSetId: 'm2a',  // CONFIRMED: API uses 'm2a'
    englishName: 'Mega Dream ex',
    japaneseName: 'メガドリームex',
    releaseDate: '2025-11-28',
  },
  'M2': {
    jpCode: 'M2',
    apiSetId: 'inferno-x',
    englishName: 'Inferno X',
    japaneseName: 'インフェルノX',
    releaseDate: '2025',
  },
  
  // SV Series (Scarlet & Violet)
  'SV1S': {
    jpCode: 'SV1S',
    apiSetId: 'scarlet-ex',
    englishName: 'Scarlet ex',
    japaneseName: 'スカーレットex',
    releaseDate: '2023-01-20',
    englishEquivalent: 'Scarlet & Violet',
  },
  'SV1V': {
    jpCode: 'SV1V',
    apiSetId: 'violet-ex',
    englishName: 'Violet ex',
    japaneseName: 'バイオレットex',
    releaseDate: '2023-01-20',
    englishEquivalent: 'Scarlet & Violet',
  },
  'SV2': {
    jpCode: 'SV2',
    apiSetId: 'snow-hazard-clay-burst',
    englishName: 'Snow Hazard / Clay Burst',
    japaneseName: 'スノーハザード / クレイバースト',
    releaseDate: '2023-04-14',
    englishEquivalent: 'Paldea Evolved',
  },
  'SV3': {
    jpCode: 'SV3',
    apiSetId: 'ruler-of-the-black-flame',
    englishName: 'Ruler of the Black Flame',
    japaneseName: '黒炎の支配者',
    releaseDate: '2023-07-28',
    englishEquivalent: 'Obsidian Flames',
  },
  'SV4': {
    jpCode: 'SV4',
    apiSetId: 'ancient-roar-future-flash',
    englishName: 'Ancient Roar / Future Flash',
    japaneseName: '古代の咆哮 / 未来の閃光',
    releaseDate: '2023',
    englishEquivalent: 'Paradox Rift',
  },
  'SV4a': {
    jpCode: 'SV4a',
    apiSetId: 'shiny-treasure-ex',
    englishName: 'Shiny Treasure ex',
    japaneseName: 'シャイニートレジャーex',
    releaseDate: '2023',
    englishEquivalent: 'Paldean Fates',
  },
  'SV5': {
    jpCode: 'SV5',
    apiSetId: 'wild-force-cyber-judge',
    englishName: 'Wild Force / Cyber Judge',
    japaneseName: 'ワイルドフォース / サイバージャッジ',
    releaseDate: '2024',
    englishEquivalent: 'Temporal Forces',
  },
  'SV6': {
    jpCode: 'SV6',
    apiSetId: 'mask-of-change',
    englishName: 'Mask of Change',
    japaneseName: '変幻の仮面',
    releaseDate: '2024',
    englishEquivalent: 'Twilight Masquerade',
  },
  'SV6a': {
    jpCode: 'SV6a',
    apiSetId: 'night-wanderer',
    englishName: 'Night Wanderer',
    japaneseName: 'ナイトワンダラー',
    releaseDate: '2024',
    englishEquivalent: 'Shrouded Fable',
  },
  'SV7': {
    jpCode: 'SV7',
    apiSetId: 'stellar-miracle',
    englishName: 'Stellar Miracle',
    japaneseName: 'ステラミラクル',
    releaseDate: '2024',
    englishEquivalent: 'Stellar Crown',
  },
  'SV8': {
    jpCode: 'SV8',
    apiSetId: 'super-electric-breaker',
    englishName: 'Super Electric Breaker',
    japaneseName: '超電ブレイカー',
    releaseDate: '2024',
    englishEquivalent: 'Surging Sparks',
  },
  'SV8a': {
    jpCode: 'SV8a',
    apiSetId: 'terastal-festival-ex',
    englishName: 'Terastal Festival ex',
    japaneseName: 'テラスタルフェスex',
    releaseDate: '2024',
    englishEquivalent: 'Prismatic Evolutions',
  },
  'SV9': {
    jpCode: 'SV9',
    apiSetId: 'sv9',  // battle-partners
    englishName: 'Battle Partners',
    japaneseName: 'バトルパートナーズ',
    releaseDate: '2025',
    englishEquivalent: 'Journey Together',
  },
  'SV10': {
    jpCode: 'SV10',
    apiSetId: 'sv10',  // glory-of-team-rocket in English
    englishName: 'The Glory of Team Rocket',
    japaneseName: 'ロケット団の栄光',
    releaseDate: '2025',
    englishEquivalent: 'Destined Rivals',
  },
  'SV11B': {
    jpCode: 'SV11B',
    apiSetId: 'sv11b',
    englishName: 'SV11 Blue',
    japaneseName: 'SV11 青',
    releaseDate: '2025',
  },
  'SV11W': {
    jpCode: 'SV11W',
    apiSetId: 'sv11w',
    englishName: 'SV11 White',
    japaneseName: 'SV11 白',
    releaseDate: '2025',
  },
  'SV9a': {
    jpCode: 'SV9a',
    apiSetId: 'hot-air-arena',
    englishName: 'Hot Air Arena',
    japaneseName: 'ホットエアアリーナ',
    releaseDate: '2025-03-14',
  },
  
  // S Series (Sword & Shield)
  'S12': {
    jpCode: 'S12',
    apiSetId: 'paradigm-trigger',
    englishName: 'Paradigm Trigger',
    japaneseName: 'パラダイムトリガー',
    releaseDate: '2022-10-21',
    englishEquivalent: 'Silver Tempest',
  },
  'S12A': {
    jpCode: 'S12a',
    apiSetId: 's12a', // CONFIRMED: API uses 's12a'
    englishName: 'VSTAR Universe',
    japaneseName: 'VSTARユニバース',
    releaseDate: '2022-12-02',
    englishEquivalent: 'Crown Zenith',
  },
};

/**
 * Get the API set identifier for a Japanese set code
 * Falls back to lowercase JP code if not found
 */
export function getApiSetId(jpCode: string): string {
  const mapping = japaneseSetMappings[jpCode.toUpperCase()];
  if (mapping) {
    return mapping.apiSetId;
  }
  // Fallback: convert to kebab-case
  return jpCode.toLowerCase().replace(/_/g, '-');
}

/**
 * Get full set information
 */
export function getSetInfo(jpCode: string): SetMapping | null {
  return japaneseSetMappings[jpCode.toUpperCase()] || null;
}

/**
 * List all available set mappings
 */
export function listAllSets(): SetMapping[] {
  return Object.values(japaneseSetMappings);
}
