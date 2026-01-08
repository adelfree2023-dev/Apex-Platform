#!/bin/bash
set +H
echo "=== STRICT LOGIN ISOLATION TEST ==="
echo ""

EMAIL="94eb395cf6@webxio.pro"
PASSWORD="94eb395cf6@webxio.pro"

TENANTS=$(curl -s http://localhost:3000/api/tenants | jq -r '.[].vendureChannelToken')

echo "Testing login for: $EMAIL"
echo "================================================"

for TOKEN in $TENANTS; do
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        sleep 3
        echo -n "Testing $TOKEN... "
        
        RESULT=$(curl -s -X POST "http://localhost:3001/shop-api" \
          -H "Content-Type: application/json" \
          -H "vendure-token: $TOKEN" \
          -d "{\"query\":\"mutation { login(username: \\\"$EMAIL\\\", password: \\\"$PASSWORD\\\") { ... on CurrentUser { id } ... on InvalidCredentialsError { errorCode } } }\"}")
        
        USER_ID=$(echo $RESULT | jq -r '.data.login.id // empty')
        ERROR=$(echo $RESULT | jq -r '.data.login.errorCode // empty')
        
        if [ -n "$USER_ID" ]; then
            echo "FAIL - Login SUCCEEDED (Should be blocked)"
        elif [ "$ERROR" = "INVALID_CREDENTIALS_ERROR" ]; then
            echo "PASS - Login blocked"
        else
            echo "UNKNOWN - $RESULT"
        fi
    fi
done

echo ""
echo "================================================"
echo "Only ONE store should allow login"
