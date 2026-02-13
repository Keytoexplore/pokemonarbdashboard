# PokemonPriceTracker API & Japanese Sets Reference

## API Overview

**Base URL:** `https://www.pokemonpricetracker.com/api/v2`

**Authentication:** Bearer token in Authorization header
```
Authorization: Bearer {API_KEY}
```

**Rate Limiting:**
- **Limit:** 60 calls per minute
- **Current Status:** API key temporarily blocked (exceeded 50 429s in 5 min window)
- **Blocked Until:** 2026-02-13T10:36:31.971Z
- **Recommendation:** Implement 1 second delay between requests, max 1 req/sec

---

## API Endpoints

### 1. Get Cards
**Endpoint:** `GET /cards`

**Query Parameters:**
| Parameter | Description | Example |
|-----------|-------------|---------|
| `set` | Set code/name | `M3`, `nihil-zero`, `silver-tempest` |
| `number` | Card number | `082`, `139` |
| `name` | Card name search | `Lugia VSTAR` |
| `language` | Card language | `japanese`, `english` |

**Response Structure:**
```json
{
  "data": [
    {
      "id": "string",
      "tcgPlayerId": "string",
      "setId": number,
      "setName": "string",
      "name": "Card Name",
      "cardNumber": "082",
      "rarity": "Secret Rare",
      "tcgPlayerUrl": "https://www.tcgplayer.com/...",
      "prices": {
        "market": 45.50,
        "low": 38.00,
        "sellers": 12,
        "listings": 24,
        "lastUpdated": "2026-02-12T12:00:00Z"
      },
      "imageCdnUrl": "https://tcgplayer-cdn.tcgplayer.com/...",
      "imageCdnUrl200": "...",
      "imageCdnUrl400": "...",
      "imageUrl": "https://..."
    }
  ],
  "metadata": {
    "total": number,
    "page": number,
    "limit": number
  }
}
```

### 2. Get Sets
**Endpoint:** `GET /sets`

**Query Parameters:**
| Parameter | Description | Example |
|-----------|-------------|---------|
| `search` | Search set name | `nihil`, `mega`, `sv` |
| `limit` | Number of results | `10`, `50`, `100` |

**Response Structure:**
```json
{
  "data": [
    {
      "id": "mongo-id",
      "tcgPlayerId": "set-code",
      "tcgPlayerNumericId": number,
      "name": "Set Name",
      "series": "Series Name",
      "releaseDate": "2026-01-23T00:00:00.000Z",
      "cardCount": 80,
      "priceGuideUrl": "https://www.tcgplayer.com/...",
      "hasPriceGuide": true,
      "imageCdnUrl": "https://tcgplayer-cdn.tcgplayer.com/set_icon/..."
    }
  ]
}
```

---

## Japanese Sets Reference

### M Series (Mega Evolution Era)

| Code | Japanese Name | English Name | Release Date | English Equivalent |
|------|---------------|--------------|--------------|-------------------|
| M3 | ムニキスゼロ (Munikisu Zero) | Nihil Zero | Jan 23, 2026 | Perfect Order (Mar 2026) |
| M2a | メガドリームex | Mega Dream ex | Nov 28, 2025 | ? |
| M2 | インフェルノX | Inferno X | ? | ? |
| MA | - | Premium Trainer Box MEGA | ? | ? |
| MBD | - | MEGA Diancie ex Starter Set | ? | ? |
| MBG | - | MEGA Gengar ex Starter Set | ? | ? |
| MC | - | Starter Deck 100 Battle Collection | Dec 19, 2025 | ? |

### SV Series (Scarlet & Violet Era)

| Code | Japanese Name | English Name | Release Date | English Equivalent |
|------|---------------|--------------|--------------|-------------------|
| SV1S/SV1V | スカーレットex / バイオレットex | Scarlet ex / Violet ex | Jan 20, 2023 | Scarlet & Violet |
| SV2 | スノーハザード / クレイバースト | Snow Hazard / Clay Burst | Apr 14, 2023 | Paldea Evolved |
| SV3 | 黒炎の支配者 | Ruler of the Black Flame | Jul 28, 2023 | Obsidian Flames |
| SV4 | 古代の咆哮 / 未来の閃光 | Ancient Roar / Future Flash | ? | Paradox Rift |
| SV4a | シャイニートレジャーex | Shiny Treasure ex | ? | Paldean Fates |
| SV5 | ワイルドフォース / サイバージャッジ | Wild Force / Cyber Judge | ? | Temporal Forces |
| SV5a | クリムゾンヘイズ | Crimson Haze | ? | ? |
| SV6 | 変幻の仮面 | Mask of Change | ? | Twilight Masquerade |
| SV6a | ナイトワンダラー | Night Wanderer | ? | Shrouded Fable |
| SV7 | ステラミラクル | Stellar Miracle | ? | Stellar Crown |
| SV7a | 楽園ドラゴーナ | Paradise Dragona | ? | ? |
| SV8 | 超電ブレイカー | Super Electric Breaker | ? | Surging Sparks |
| SV8a | テラスタルフェスex | Terastal Festival ex | ? | Prismatic Evolutions |
| SV9 | バトルパートナーズ | Battle Partners | ? | Journey Together |
| SV9a | ホットエアアリーナ | Hot Air Arena | Mar 14, 2025 | ? |

### S Series (Sword & Shield Era)

| Code | Japanese Name | English Name | Release Date | English Equivalent |
|------|---------------|--------------|--------------|-------------------|
| S1S/S1H | ソード / シールド | Sword / Shield | Dec 6, 2019 | Sword & Shield |
| S2 | 反逆クラッシュ | Rebellion Crash | Mar 6, 2020 | Rebel Clash |
| S3 | ムゲンゾーン | Infinity Zone | Jun 5, 2020 | Darkness Ablaze |
| S4 | 仰天のボルテッカー | Amazing Volt Tackle | Sep 18, 2020 | Vivid Voltage |
| S5 | 一撃マスター / 連撃マスター | Single Strike / Rapid Strike Master | Jan 22, 2021 | Battle Styles |
| S6 | 白銀のランス / 漆黒のガイスト | Silver Lance / Jet-Black Spirit | Apr 23, 2021 | Chilling Reign |
| S7 | 摩天パーフェクト / 蒼空ストリーム | Skyscraping Perfection / Blue Sky Stream | Jul 9, 2021 | Evolving Skies |
| S8 | フュージョンアーツ | Fusion Arts | Sep 24, 2021 | Fusion Strike |
| S9 | スターバース | Star Birth | Jan 14, 2022 | Brilliant Stars |
| S10 | タイムゲイザー / スペースジャグラー | Time Gazer / Space Juggler | Apr 8, 2022 | Astral Radiance |
| S11 | ロストアビス | Lost Abyss | Jul 15, 2022 | Lost Origin |
| S12 | パラダイムトリガー | Paradigm Trigger | Oct 21, 2022 | Silver Tempest |

---

## Card Number Formats

### Japanese Cards
- **Format:** `XXX/YYY` where XXX is card number, YYY is set total
- **Examples:** `082/080`, `093/080`
- **API Query:** Use just the number part (e.g., `082` not `082/080`)

### Secret Rare Numbering
- **SR (Secret Rare):** Usually numbered above set total (e.g., 081-085 for M3)
- **AR (Art Rare):** Special art versions (e.g., 086-092 for M3)
- **SAR (Special Art Rare):** Ultra rare art versions (e.g., 093-096 for M3)
- **UR (Ultra Rare):** Gold/secret versions (e.g., 097-117 for M3)

---

## Example API Calls

### Get Japanese M3 Card (when rate limit clears)
```javascript
fetch('https://www.pokemonpricetracker.com/api/v2/cards?set=m3&number=082', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Accept': 'application/json'
  }
})
```

### Search by Card Name
```javascript
fetch('https://www.pokemonpricetracker.com/api/v2/cards?name=Lugia%20VSTAR', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Accept': 'application/json'
  }
})
```

### Get All Sets
```javascript
fetch('https://www.pokemonpricetracker.com/api/v2/sets?limit=100', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Accept': 'application/json'
  }
})
```

---

## Implementation Notes

### Current Issues
1. **M3 set not found:** API returns 0 results for `set=M3`
   - Possible API uses different set identifier
   - Try: `nihil-zero`, `nihil_zero`, `munikisu-zero`
   
2. **Rate limiting aggressive:** 
   - Blocked after ~50 requests
   - Need 1+ second delays between calls
   - Consider caching aggressively

### Recommended Architecture
```
Dashboard (Next.js)
    ↓
API Route (/api/prices) with caching
    ↓
PokemonPriceTracker API
    ↓
Cache 3 days (ISR or Redis)
```

### Next Steps
1. Test API with various Japanese set identifiers
2. Build set name mapping (JP code → API set ID)
3. Implement server-side rate limiting
4. Add caching layer

---

## Resources

- **Bulbapedia Japanese Sets:** https://bulbapedia.bulbagarden.net/wiki/List_of_Japanese_Pok%C3%A9mon_Trading_Card_Game_expansions
- **Serebii Cardex:** https://www.serebii.net/card/japanese.shtml
- **PokeGuardian:** https://www.pokeguardian.com/sets/set-lists/japanese-sets
