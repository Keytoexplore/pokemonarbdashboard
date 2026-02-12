#!/bin/bash

# Pokemon Arbitrage Data Update Script
# This script is designed to run every 3 days via cron

set -e

echo "🚀 Starting Pokemon Arbitrage Data Update"
echo "⏰ $(date)"
echo ""

cd /data/.openclaw/workspace/pokemonarbdashboard

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Set API key
export POKEMON_PRICE_TRACKER_API_KEY="pokeprice_free_67abf1594acce302cdbaaf1339c9234cbc402f5726e95cd7"

# Generate data
echo "📊 Generating arbitrage data..."
npx tsx generate-data.ts

# Commit to git (optional - uncomment if you want to save data to repo)
# echo "💾 Committing to git..."
# git add data/arbitrage-data.json
# git commit -m "Update arbitrage data - $(date +%Y-%m-%d)" || true
# git push origin main || true

echo ""
echo "✅ Update complete!"
echo "⏰ $(date)"