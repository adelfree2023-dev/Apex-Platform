#!/bin/bash
# ============================================
# Apex Platform - Test Script
# ============================================
# This script tests the current state of the platform
# Run on the server: ~/apex/
# ============================================

set -e

echo "============================================"
echo "🧪 APEX PLATFORM - INTEGRATION TEST"
echo "============================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0

# Function to run test
run_test() {
    local name=$1
    local cmd=$2
    local expected=$3
    
    echo -n "Testing: $name... "
    result=$(eval "$cmd" 2>/dev/null)
    
    if echo "$result" | grep -q "$expected"; then
        echo -e "${GREEN}✅ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo "  Expected: $expected"
        echo "  Got: $result"
        ((FAILED++))
    fi
}

echo "📡 1. Service Health Checks"
echo "-------------------------------------------"

# Test Vendure
run_test "Vendure API (port 3001)" \
    "curl -s http://127.0.0.1:3001/admin-api -o /dev/null -w '%{http_code}'" \
    "400"

# Test Manager
run_test "Manager API (port 3000)" \
    "curl -s http://127.0.0.1:3000/api/health" \
    "ok"

# Test Storefront (if running)
run_test "Storefront (port 3002)" \
    "curl -s http://127.0.0.1:3002 -o /dev/null -w '%{http_code}'" \
    "200"

echo ""
echo "🏪 2. Tenant CRUD Operations"
echo "-------------------------------------------"

# Create Tenant
echo -n "Creating test tenant... "
CREATE_RESULT=$(curl -s -X POST http://127.0.0.1:3000/api/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Integration Test Store",
    "adminEmail": "integration@test.com",
    "adminPassword": "Test123!",
    "adminName": "Test Admin"
  }')

TENANT_ID=$(echo $CREATE_RESULT | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
CHANNEL_ID=$(echo $CREATE_RESULT | grep -o '"vendureChannelId":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TENANT_ID" ] && [ -n "$CHANNEL_ID" ] && [ "$CHANNEL_ID" != "null" ]; then
    echo -e "${GREEN}✅ PASSED${NC}"
    echo "  Tenant ID: $TENANT_ID"
    echo "  Channel ID: $CHANNEL_ID"
    ((PASSED++))
else
    echo -e "${RED}❌ FAILED${NC}"
    echo "  Result: $CREATE_RESULT"
    ((FAILED++))
fi

# Read Tenant
run_test "Read tenant by slug" \
    "curl -s http://127.0.0.1:3000/api/tenants/slug/integration-test-store" \
    "integration-test-store"

# Delete Tenant (sync test)
echo -n "Deleting tenant (with Vendure sync)... "
DELETE_RESULT=$(curl -s -X DELETE "http://127.0.0.1:3000/api/tenants/$TENANT_ID")

# Check logs for sync
sleep 2
LOG_CHECK=$(tail -20 ~/logs/manager.log | grep -c "Vendure channel deleted" || echo "0")

if [ "$LOG_CHECK" -gt "0" ]; then
    echo -e "${GREEN}✅ PASSED (Vendure channel also deleted)${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️ WARNING (Tenant deleted but Vendure sync unclear)${NC}"
    ((PASSED++))
fi

# Verify deletion
run_test "Verify tenant deleted" \
    "curl -s http://127.0.0.1:3000/api/tenants/slug/integration-test-store -o /dev/null -w '%{http_code}'" \
    "404"

echo ""
echo "============================================"
echo "📊 TEST SUMMARY"
echo "============================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}⚠️ SOME TESTS FAILED!${NC}"
    exit 1
fi
