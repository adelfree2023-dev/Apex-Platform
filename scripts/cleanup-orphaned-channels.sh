#!/bin/bash
# ============================================
# Apex Platform - Cleanup Script
# ============================================
# Deletes orphaned channels from Vendure that don't exist in Manager DB
# Run on the server: ~/apex/
# ============================================

echo "============================================"
echo "🧹 CLEANUP ORPHANED VENDURE CHANNELS"
echo "============================================"
echo ""

# Get all tenants from Manager
echo "📋 Fetching tenants from Manager DB..."
MANAGER_TENANTS=$(curl -s http://127.0.0.1:3000/api/tenants | grep -o '"slug":"[^"]*"' | cut -d'"' -f4)
echo "Manager tenants: $MANAGER_TENANTS"
echo ""

# Channels to delete (known orphaned ones)
ORPHANED_CHANNELS=("test-store" "adel" "adel2" "adel4" "adel-store")

echo "🗑️ Deleting orphaned channels..."
echo ""

for channel in "${ORPHANED_CHANNELS[@]}"; do
    # Check if channel exists in Manager tenants
    if echo "$MANAGER_TENANTS" | grep -q "^${channel}$"; then
        echo "⏭️ Skipping $channel (exists in Manager)"
    else
        echo "🗑️ Deleting orphaned channel: $channel"
        # Note: This requires Vendure Admin API access with auth
        # For now, this is a placeholder - actual deletion should be done via:
        # 1. Vendure Admin UI
        # 2. Or GraphQL mutation with proper auth
        echo "   → Delete manually from Vendure Admin UI"
    fi
done

echo ""
echo "============================================"
echo "⚠️ MANUAL STEPS REQUIRED:"
echo "============================================"
echo "1. Open Vendure Admin: http://34.18.154.179:3001/admin"
echo "2. Login as superadmin"
echo "3. Go to Settings → Channels"
echo "4. Delete these channels:"
for channel in "${ORPHANED_CHANNELS[@]}"; do
    echo "   - $channel"
done
echo ""
echo "After cleanup, run: ./scripts/integration-test.sh"
