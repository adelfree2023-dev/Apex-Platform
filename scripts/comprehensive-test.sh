#!/bin/bash
#############################################
# 🔥 APEX PLATFORM - COMPREHENSIVE TEST SCRIPT
# Tests: Tenants, Auth, Users, Vendure Integration
#############################################

set -e

MANAGER_API="http://127.0.0.1:3000"
VENDURE_API="http://127.0.0.1:3001"

echo "🚀 Starting Apex Platform Comprehensive Tests..."
echo "================================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0

log_success() { echo -e "${GREEN}✅ $1${NC}"; ((PASS++)); }
log_fail() { echo -e "${RED}❌ $1${NC}"; ((FAIL++)); }
log_info() { echo -e "${YELLOW}ℹ️  $1${NC}"; }

#############################################
# TEST 1: Health Checks
#############################################
echo ""
echo "📋 TEST 1: Health Checks"
echo "------------------------"

# Manager API
if curl -s "$MANAGER_API/api/health" | grep -q "ok"; then
    log_success "Manager API is healthy"
else
    log_fail "Manager API is down"
fi

# Vendure API
if curl -s "$VENDURE_API/admin-api" -X POST -H "Content-Type: application/json" \
   -d '{"query":"{ __typename }"}' | grep -q "Query"; then
    log_success "Vendure API is healthy"
else
    log_fail "Vendure API is down"
fi

#############################################
# TEST 2: Create 10 Tenants
#############################################
echo ""
echo "📋 TEST 2: Creating 10 Tenants"
echo "------------------------------"

TENANT_SLUGS=()

for i in {1..10}; do
    TENANT_NAME="Test Store $i"
    TENANT_EMAIL="admin$i@store$i.com"
    
    log_info "Creating tenant: $TENANT_NAME"
    
    RESPONSE=$(curl -s -X POST "$MANAGER_API/api/tenants" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"$TENANT_NAME\",
            \"adminEmail\": \"$TENANT_EMAIL\",
            \"adminPassword\": \"Admin123!\",
            \"adminName\": \"Admin $i\"
        }")
    
    if echo "$RESPONSE" | grep -q "slug"; then
        SLUG=$(echo "$RESPONSE" | grep -o '"slug":"[^"]*"' | cut -d'"' -f4)
        TENANT_SLUGS+=("$SLUG")
        log_success "Created tenant: $SLUG"
    else
        log_fail "Failed to create tenant $i: $RESPONSE"
    fi
done

echo ""
echo "Created ${#TENANT_SLUGS[@]} tenants"

#############################################
# TEST 3: Register 10 Customers per Tenant
#############################################
echo ""
echo "📋 TEST 3: Registering 10 Customers per Tenant"
echo "-----------------------------------------------"

for SLUG in "${TENANT_SLUGS[@]:0:3}"; do  # Test first 3 tenants only
    log_info "Testing tenant: $SLUG"
    
    for j in {1..10}; do
        EMAIL="customer${j}_${SLUG}@test.com"
        
        RESPONSE=$(curl -s -X POST "$MANAGER_API/api/auth/register" \
            -H "Content-Type: application/json" \
            -d "{
                \"email\": \"$EMAIL\",
                \"password\": \"Customer123!\",
                \"name\": \"Customer $j\"
            }")
        
        if echo "$RESPONSE" | grep -q "user"; then
            log_success "Registered: $EMAIL"
        else
            log_fail "Failed: $EMAIL - $(echo "$RESPONSE" | head -c 50)"
        fi
    done
done

#############################################
# TEST 4: Login Tests
#############################################
echo ""
echo "📋 TEST 4: Login Tests"
echo "----------------------"

for SLUG in "${TENANT_SLUGS[@]:0:3}"; do
    EMAIL="customer1_${SLUG}@test.com"
    
    RESPONSE=$(curl -s -X POST "$MANAGER_API/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$EMAIL\",
            \"password\": \"Customer123!\"
        }")
    
    if echo "$RESPONSE" | grep -q "accessToken"; then
        ACCESS_TOKEN=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
        log_success "Login successful: $EMAIL"
        
        # Test /users/me
        ME_RESPONSE=$(curl -s -X GET "$MANAGER_API/api/users/me" \
            -H "Authorization: Bearer $ACCESS_TOKEN")
        
        if echo "$ME_RESPONSE" | grep -q "email"; then
            log_success "GET /users/me successful"
        else
            log_fail "GET /users/me failed"
        fi
    else
        log_fail "Login failed: $EMAIL"
    fi
done

#############################################
# TEST 5: Password Reset Flow
#############################################
echo ""
echo "📋 TEST 5: Password Reset Flow"
echo "-------------------------------"

for SLUG in "${TENANT_SLUGS[@]:0:2}"; do
    EMAIL="customer2_${SLUG}@test.com"
    
    RESPONSE=$(curl -s -X POST "$MANAGER_API/api/auth/forgot-password" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$EMAIL\"}")
    
    if echo "$RESPONSE" | grep -q -E "message|success"; then
        log_success "Forgot password sent for: $EMAIL"
    else
        log_fail "Forgot password failed: $EMAIL"
    fi
done

#############################################
# TEST 6: Seed Products
#############################################
echo ""
echo "📋 TEST 6: Seed Products"
echo "------------------------"

for SLUG in "${TENANT_SLUGS[@]:0:5}"; do
    RESPONSE=$(curl -s -X POST "$MANAGER_API/api/tenants/slug/$SLUG/seed")
    
    if echo "$RESPONSE" | grep -q "success"; then
        SEEDED=$(echo "$RESPONSE" | grep -o '"seeded":[0-9]*' | cut -d':' -f2)
        log_success "Seeded $SEEDED products for $SLUG"
    else
        log_fail "Failed to seed products for $SLUG"
    fi
done

#############################################
# TEST 7: Vendure Channel Sync
#############################################
echo ""
echo "📋 TEST 7: Vendure Channel Sync"
echo "--------------------------------"

MANAGER_TENANTS=$(curl -s "$MANAGER_API/api/tenants" | grep -o '"vendureChannelId":"[0-9]*"' | wc -l)
log_info "Manager has $MANAGER_TENANTS tenants with vendureChannelId"

#############################################
# TEST 8: Delete Test Tenants
#############################################
echo ""
echo "📋 TEST 8: Delete Test Tenants"
echo "-------------------------------"

for SLUG in "${TENANT_SLUGS[@]:5:5}"; do  # Delete last 5 tenants
    # Get tenant ID
    TENANT_DATA=$(curl -s "$MANAGER_API/api/tenants/slug/$SLUG")
    TENANT_ID=$(echo "$TENANT_DATA" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -n "$TENANT_ID" ]; then
        RESPONSE=$(curl -s -X DELETE "$MANAGER_API/api/tenants/$TENANT_ID")
        
        if echo "$RESPONSE" | grep -q -E "success|deleted|id"; then
            log_success "Deleted tenant: $SLUG"
        else
            log_fail "Failed to delete: $SLUG"
        fi
    fi
done

#############################################
# RESULTS
#############################################
echo ""
echo "================================================"
echo "🏁 TEST RESULTS"
echo "================================================"
echo -e "${GREEN}✅ Passed: $PASS${NC}"
echo -e "${RED}❌ Failed: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Check above for details.${NC}"
    exit 1
fi
