#!/usr/bin/env node
/**
 * Add multiple SV sets at once
 * Usage: node scripts/add-sv-sets.js
 */

const { execSync } = require('child_process');

const setsToAdd = [
  'SV10',
  'SV9',
  'SV8a',
  'SV8',
  'SV7',
  'SV6a',
  'SV6',
  'SV5',
  'SV4a',
  'SV4',
  'SV3',
  'SV2'
];

console.log('='.repeat(60));
console.log('🚀 Adding Multiple SV Sets');
console.log('='.repeat(60));
console.log(`Sets to add: ${setsToAdd.join(', ')}`);
console.log('');

for (const set of setsToAdd) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📦 Processing ${set}...`);
  console.log('='.repeat(60));
  
  try {
    execSync(`node scripts/add-set.js ${set}`, {
      stdio: 'inherit',
      timeout: 600000 // 10 minutes per set
    });
    console.log(`\n✅ ${set} completed successfully`);
  } catch (error) {
    console.error(`\n❌ ${set} failed:`, error.message);
  }
}

console.log('\n' + '='.repeat(60));
console.log('🏁 All sets processed!');
console.log('='.repeat(60));
console.log('\nNext steps:');
console.log('  1. Run: npm run build');
console.log('  2. Commit changes');
