#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# LuxStay Hotel — Database Seed Runner
# Usage:  bash seed.sh [MONGO_URI]
# Default URI: mongodb://localhost:27017/hotel
# ─────────────────────────────────────────────────────────────────────────────
set -e

MONGO_URI="${1:-mongodb://localhost:27017/hotel}"

echo "🌱 Seeding database: $MONGO_URI"
mongosh "$MONGO_URI" seed.js

echo ""
echo "✅ Seed complete. You can now log in with:"
echo "   owner@luxstay.vn           → OWNER"
echo "   manager.hanoi@luxstay.vn   → MANAGER"
echo "   staff1.hanoi@luxstay.vn    → STAFF"
echo "   alice@example.com          → CUSTOMER"
echo "   Password for all: Demo@123"
