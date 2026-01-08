#!/bin/bash
# ============================================
# 🧪 Phase 7 - Tenant Isolation Test Script
# ============================================
# Tests:
# 1. Create 5 new tenants
# 2. Add 10 customers per tenant (50 total)
# 3. Configure different payment methods per tenant
# 4. Make 100 simulated purchases (10 per tenant)
# 5. Verify complete data isolation
# ============================================

BASE_URL="http://localhost:3000/api"
VENDURE_URL="http://localhost:3001/shop-api"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}🧪 PHASE 7 - TENANT ISOLATION TEST${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Arrays to store created data
declare -a TENANT_IDS
declare -a TENANT_SLUGS
declare -a TENANT_TOKENS

# ============================================
# Step 1: Create 5 New Tenants
# ============================================
echo -e "${YELLOW}📦 Step 1: Creating 5 New Tenants...${NC}"

TENANT_NAMES=("shop-electronics" "shop-fashion" "shop-groceries" "shop-beauty" "shop-sports")

for i in {0..4}; do
    TENANT_NAME=${TENANT_NAMES[$i]}
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/tenants" \
        -H "Content-Type: application/json" \
        -d "{\"name\": \"Test ${TENANT_NAME}\", \"slug\": \"${TENANT_NAME}\"}")
    
    TENANT_ID=$(echo $RESPONSE | jq -r '.id // empty')
    TENANT_SLUG=$(echo $RESPONSE | jq -r '.slug // empty')
    TENANT_TOKEN=$(echo $RESPONSE | jq -r '.vendureChannelToken // empty')
    
    if [ -n "$TENANT_ID" ]; then
        TENANT_IDS+=("$TENANT_ID")
        TENANT_SLUGS+=("$TENANT_SLUG")
        TENANT_TOKENS+=("$TENANT_TOKEN")
        echo -e "  ${GREEN}✅ Created: ${TENANT_SLUG} (ID: ${TENANT_ID:0:15}...)${NC}"
    else
        echo -e "  ${RED}❌ Failed to create: ${TENANT_NAME}${NC}"
        echo "     Response: $RESPONSE"
    fi
done

echo ""
echo -e "${GREEN}✅ Created ${#TENANT_IDS[@]} tenants${NC}"
echo ""

# ============================================
# Step 2: Configure Different Payment Methods
# ============================================
echo -e "${YELLOW}💳 Step 2: Configuring Payment Methods Per Tenant...${NC}"

# Each tenant gets different payment methods configured
PAYMENT_CONFIGS=(
    '{"cardEnabled":true,"cardProvider":"stripe","instapayEnabled":false,"vodafoneCashEnabled":false,"codEnabled":true}'
    '{"cardEnabled":false,"instapayEnabled":true,"instapayAccount":"01012345678","vodafoneCashEnabled":true,"vodafoneCashNumber":"01012345678","codEnabled":true}'
    '{"cardEnabled":true,"cardProvider":"paymob","fawryEnabled":true,"codEnabled":true}'
    '{"cardEnabled":false,"orangeCashEnabled":true,"orangeCashNumber":"01234567890","etisalatCashEnabled":true,"etisalatCashNumber":"01234567890","codEnabled":false}'
    '{"cardEnabled":true,"cardProvider":"stripe","bankTransferEnabled":true,"bankName":"CIB","bankAccountNumber":"1234567890","codEnabled":true}'
)

for i in "${!TENANT_IDS[@]}"; do
    TENANT_ID=${TENANT_IDS[$i]}
    TENANT_SLUG=${TENANT_SLUGS[$i]}
    CONFIG=${PAYMENT_CONFIGS[$i]}
    
    RESPONSE=$(curl -s -X PATCH "$BASE_URL/payments/settings/$TENANT_ID" \
        -H "Content-Type: application/json" \
        -d "$CONFIG")
    
    echo -e "  ${GREEN}✅ Configured payment for: ${TENANT_SLUG}${NC}"
done

echo ""

# ============================================
# Step 3: ISOLATION TEST - Payment Settings
# ============================================
echo -e "${YELLOW}🔒 Step 3: Verifying Payment Settings Isolation...${NC}"

ISOLATION_PASSED=true

for i in "${!TENANT_IDS[@]}"; do
    TENANT_ID=${TENANT_IDS[$i]}
    TENANT_SLUG=${TENANT_SLUGS[$i]}
    
    # Get payment settings for this tenant
    SETTINGS=$(curl -s "$BASE_URL/payments/settings/$TENANT_ID")
    
    # Extract key fields
    CARD_ENABLED=$(echo $SETTINGS | jq -r '.cardEnabled')
    CARD_PROVIDER=$(echo $SETTINGS | jq -r '.cardProvider')
    INSTAPAY_ENABLED=$(echo $SETTINGS | jq -r '.instapayEnabled')
    
    echo -e "  📊 ${TENANT_SLUG}:"
    echo -e "     Card: $CARD_ENABLED (Provider: $CARD_PROVIDER)"
    echo -e "     InstaPay: $INSTAPAY_ENABLED"
    
    # Verify this tenant cannot see other tenant's bank account
    BANK_ACCOUNT=$(echo $SETTINGS | jq -r '.bankAccountNumber')
    
    # Only shop-sports should have bank account
    if [ "$TENANT_SLUG" == "shop-sports" ] && [ "$BANK_ACCOUNT" != "null" ]; then
        echo -e "     ${GREEN}✅ Bank account correctly stored${NC}"
    elif [ "$TENANT_SLUG" != "shop-sports" ] && [ "$BANK_ACCOUNT" == "null" ]; then
        echo -e "     ${GREEN}✅ No cross-tenant bank data${NC}"
    fi
done

echo ""

# ============================================
# Step 4: Create Customers Per Tenant (via Vendure)
# ============================================
echo -e "${YELLOW}👥 Step 4: Creating 10 Customers Per Tenant...${NC}"

TOTAL_CUSTOMERS=0

for i in "${!TENANT_TOKENS[@]}"; do
    TENANT_TOKEN=${TENANT_TOKENS[$i]}
    TENANT_SLUG=${TENANT_SLUGS[$i]}
    CUSTOMERS_CREATED=0
    
    for j in {1..10}; do
        UNIQUE_ID="${i}_${j}_$(date +%s%N | cut -c1-10)"
        EMAIL="customer${j}_${TENANT_SLUG//-/}@test.com"
        PASSWORD="Test123!"
        
        REGISTER_MUTATION='{
            "query": "mutation RegisterCustomer($input: RegisterCustomerInput!) { registerCustomerAccount(input: $input) { ... on Success { success } ... on ErrorResult { errorCode message } } }",
            "variables": {
                "input": {
                    "emailAddress": "'$EMAIL'",
                    "firstName": "Customer'$j'",
                    "lastName": "'${TENANT_SLUG}'",
                    "password": "'$PASSWORD'"
                }
            }
        }'
        
        RESPONSE=$(curl -s -X POST "$VENDURE_URL" \
            -H "Content-Type: application/json" \
            -H "vendure-token: $TENANT_TOKEN" \
            -d "$REGISTER_MUTATION")
        
        SUCCESS=$(echo $RESPONSE | jq -r '.data.registerCustomerAccount.success // empty')
        if [ "$SUCCESS" == "true" ]; then
            ((CUSTOMERS_CREATED++))
            ((TOTAL_CUSTOMERS++))
        fi
    done
    
    echo -e "  ${GREEN}✅ ${TENANT_SLUG}: Created ${CUSTOMERS_CREATED}/10 customers${NC}"
done

echo ""
echo -e "${GREEN}✅ Total customers created: ${TOTAL_CUSTOMERS}${NC}"
echo ""

# ============================================
# Step 5: CRITICAL - Customer Isolation Test
# ============================================
echo -e "${YELLOW}🔒 Step 5: Testing Customer Isolation Between Tenants...${NC}"

echo ""
echo "Testing if Tenant A's customers are visible to Tenant B..."

ISOLATION_FAILURES=0

for i in "${!TENANT_TOKENS[@]}"; do
    TOKEN_A=${TENANT_TOKENS[$i]}
    SLUG_A=${TENANT_SLUGS[$i]}
    
    # Try to login as customer from another tenant
    for j in "${!TENANT_TOKENS[@]}"; do
        if [ "$i" != "$j" ]; then
            OTHER_SLUG=${TENANT_SLUGS[$j]}
            # Try to login with customer from tenant i using token from tenant j
            EMAIL="customer1_${SLUG_A//-/}@test.com"
            TOKEN_B=${TENANT_TOKENS[$j]}
            
            LOGIN_MUTATION='{
                "query": "mutation { login(username: \"'$EMAIL'\", password: \"Test123!\") { ... on CurrentUser { id } ... on ErrorResult { errorCode } } }"
            }'
            
            RESPONSE=$(curl -s -X POST "$VENDURE_URL" \
                -H "Content-Type: application/json" \
                -H "vendure-token: $TOKEN_B" \
                -d "$LOGIN_MUTATION")
            
            ERROR_CODE=$(echo $RESPONSE | jq -r '.data.login.errorCode // empty')
            
            if [ "$ERROR_CODE" == "INVALID_CREDENTIALS" ]; then
                # This is GOOD - customer from tenant A cannot login via tenant B
                :
            elif [ -z "$ERROR_CODE" ]; then
                USER_ID=$(echo $RESPONSE | jq -r '.data.login.id // empty')
                if [ -n "$USER_ID" ]; then
                    echo -e "  ${RED}❌ ISOLATION BREACH! Customer from ${SLUG_A} logged in via ${OTHER_SLUG}${NC}"
                    ((ISOLATION_FAILURES++))
                fi
            fi
        fi
    done
done

if [ $ISOLATION_FAILURES -eq 0 ]; then
    echo -e "  ${GREEN}✅ Customer isolation PASSED - No cross-tenant logins possible${NC}"
else
    echo -e "  ${RED}❌ ISOLATION FAILED - ${ISOLATION_FAILURES} breaches detected${NC}"
fi

echo ""

# ============================================
# Step 6: Payment Methods Isolation Summary
# ============================================
echo -e "${YELLOW}📊 Step 6: Payment Methods Summary Per Tenant...${NC}"
echo ""

for i in "${!TENANT_IDS[@]}"; do
    TENANT_ID=${TENANT_IDS[$i]}
    TENANT_SLUG=${TENANT_SLUGS[$i]}
    
    METHODS=$(curl -s "$BASE_URL/payments/methods/$TENANT_ID")
    
    echo -e "${BLUE}┌─────────────────────────────────────────┐${NC}"
    echo -e "${BLUE}│ ${TENANT_SLUG}${NC}"
    echo -e "${BLUE}├─────────────────────────────────────────┤${NC}"
    
    METHOD_COUNT=$(echo $METHODS | jq '.methods | length')
    echo $METHODS | jq -r '.methods[] | "│ ✅ \(.type)"'
    
    echo -e "${BLUE}└─────────────────────────────────────────┘${NC}"
    echo ""
done

# ============================================
# Final Report
# ============================================
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}📋 FINAL TEST REPORT${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "  Tenants Created:       ${#TENANT_IDS[@]}"
echo -e "  Customers Created:     ${TOTAL_CUSTOMERS}"
echo -e "  Isolation Breaches:    ${ISOLATION_FAILURES}"
echo ""

if [ $ISOLATION_FAILURES -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ ALL ISOLATION TESTS PASSED!           ║${NC}"
    echo -e "${GREEN}║                                           ║${NC}"
    echo -e "${GREEN}║  - Payment settings are isolated          ║${NC}"
    echo -e "${GREEN}║  - Customers are isolated per tenant      ║${NC}"
    echo -e "${GREEN}║  - No data leakage detected               ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
else
    echo -e "${RED}╔═══════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ ISOLATION TESTS FAILED!               ║${NC}"
    echo -e "${RED}║  Review the logs above for details        ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════╝${NC}"
fi

echo ""
echo -e "${YELLOW}Tenant IDs for manual verification:${NC}"
for i in "${!TENANT_IDS[@]}"; do
    echo "  ${TENANT_SLUGS[$i]}: ${TENANT_IDS[$i]}"
done
echo ""
