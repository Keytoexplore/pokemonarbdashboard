/**
 * Master script for adding a new set
 * Usage: npx ts-node scripts/add-set.ts SV10
 */

import * as fs from 'fs';
import * as path from 'path';

const setCode = process.argv[2];

if (!setCode) {
  console.error('Usage: npx ts-node scripts/add-set.ts <SET_CODE>');
  console.error('Example: npx ts-node scripts/add-set.ts SV10');
  process.exit(1);
}

console.log('='.repeat(60));
console.log(`Adding new set: ${setCode}`);
console.log('='.repeat(60));

console.log('\n📋 CHECKLIST FOR ADDING A NEW SET:');
console.log('-'.repeat(60));

console.log('\n1️⃣  Add set mapping to lib/set-mappings.ts');
console.log('   Example:');
console.log(`   '${setCode}': {`);
console.log(`     jpCode: '${setCode}',`);
console.log(`     apiSetId: '${setCode.toLowerCase()}',  // Adjust if needed`);
console.log(`     englishName: 'Set Name',`);
console.log(`     japaneseName: 'セット名',`);
console.log(`     releaseDate: '2026-01-01',`);
console.log(`   },`);

console.log('\n2️⃣  Add cards to lib/card-data.ts');
console.log('   - Scrape from Japan-Toreca');
console.log('   - Scrape from TorecaCamp');
console.log('   - Or enter manually');

console.log('\n3️⃣  Run price update script:');
console.log('   npx ts-node scripts/update-prices.ts');

console.log('\n4️⃣  Commit and push:');
console.log('   git add -A');
console.log(`   git commit -m "feat: Add ${setCode} set"`);
console.log('   git push');

console.log('\n' + '='.repeat(60));
console.log('FILES TO MODIFY:');
console.log('-'.repeat(60));
console.log('1. lib/set-mappings.ts    - Add set mapping');
console.log('2. lib/card-data.ts       - Add card data');
console.log('3. data/prices.json       - Generated (don\'t edit)');
console.log('4. SETUP.md               - Documentation (optional)');
console.log('='.repeat(60));

console.log('\n✅ Ready to start! Edit the files above, then run the update script.');
