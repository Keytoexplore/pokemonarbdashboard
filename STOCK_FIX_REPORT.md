# Stock Status Detection Fix Report

## Problem Summary
The dashboard was showing incorrect stock status for Japanese shop cards:
- Pawniard Japan-Toreca B=¥280 shown as "in stock" but actually OUT of stock
- Pawniard A-=¥500 actually IN stock but not showing correctly
- TorecaCamp out-of-stock cards showing as in stock

## Root Cause Analysis

### Japan-Toreca
The original scraper checked for "売り切れ" (sold out) text anywhere in the HTML, but this text appears in JavaScript code, CSS, and translations even when products are in stock. This caused false negatives.

### TorecaCamp
The scraper relied on the `available` field from the variants JSON, but this field may not always be set correctly. Additionally, no fallback checks were in place.

## Solution Implemented

### 1. Improved Japan-Toreca Stock Detection (add-set.js, scrape-japanese.js)

**Priority-based detection system:**
1. **Priority 1**: Check explicit inventory count (`在庫数: X`)
   - If count is 0 → OUT OF STOCK
   - If count is >0 → IN STOCK
2. **Priority 2**: Check for explicit no-stock patterns
   - `在庫数: 0` or `在庫数: 売り切れ`
3. **Priority 3**: Check add-to-cart button state
   - Button disabled → OUT OF STOCK
4. **Priority 4**: Check for in-stock messages
   - `在庫あり` or `X点在庫` patterns
5. **Fallback**: No price displayed → OUT OF STOCK

**Key changes:**
- Removed generic "売り切れ" text check that caused false positives
- Added regex patterns to find inventory count in product info
- Added check for disabled add-to-cart button
- Added check for positive stock indicators

### 2. Improved TorecaCamp Stock Detection (add-set.js, scrape-torecacamp.js)

**Multi-signal detection:**
1. Check `variant.available` field
2. Check `variant.inventory_quantity` if available
3. Check HTML for sold out text (`売り切れ`, `在庫なし`)
4. Fallback: No price → OUT OF STOCK

**Key changes:**
- Added HTML-level sold out text detection as backup
- Added inventory quantity check
- Added price validation fallback

## Test Results

### Pawniard (SV11B 147) - Japan-Toreca
| Variant | Price | Stock Status | Verification |
|---------|-------|--------------|--------------|
| A | ¥550 | IN STOCK ✓ | Has add to cart button, in-stock message |
| A- | ¥500 | IN STOCK ✓ | Has add to cart button, in-stock message |
| B | ¥350 | OUT OF STOCK ✗ | Button disabled |

### Pawniard (SV11B 147) - TorecaCamp
| Variant | Price | Stock Status | Verification |
|---------|-------|--------------|--------------|
| A | ¥380 | OUT OF STOCK ✗ | `在庫なし` in HTML |
| B | ¥280 | OUT OF STOCK ✗ | `在庫なし` in HTML |

## Files Modified

1. **scripts/add-set.js**
   - Updated `scrapeJapanToreca()` function with improved stock detection
   - Updated `scrapeTorecaCamp()` function with improved stock detection

2. **scripts/scrape-japanese.js**
   - Updated `scrapeWithPuppeteer()` function with improved stock detection logic

3. **scripts/scrape-torecacamp.js**
   - Updated `extractVariants()` function with additional stock checks

4. **scripts/test-stock-detection.js** (new file)
   - Test script to verify stock detection works correctly

## Verification Commands

```bash
# Test stock detection for Pawniard
node scripts/test-stock-detection.js

# Scrape TorecaCamp with updated logic
node scripts/scrape-torecacamp.js

# Scrape all Japanese prices
node scripts/scrape-japanese.js

# Add a new set with improved detection
node scripts/add-set.js SV11B
```

## Recommendations

1. **Run the test script** to verify detection is working: `node scripts/test-stock-detection.js`
2. **Re-scrape existing data** to update stock statuses with the corrected logic
3. **Monitor for edge cases** - some products may use different stock indicators
4. **Consider adding retries** with different detection methods if stock status is unclear

## Future Improvements

1. Add caching of last known price for out-of-stock items
2. Add timestamp to stock status to know when it was last checked
3. Consider adding stock history tracking
4. Add alerts when out-of-stock items come back in stock
