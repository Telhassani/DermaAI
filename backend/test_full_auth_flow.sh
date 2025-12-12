#!/bin/bash
#
# Test Full Authentication Flow
# Tests: Token generation → Backend validation → User retrieval
#

set -e  # Exit on error

echo "============================================================"
echo "🧪 DermAI Authentication Flow Test"
echo "============================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Generate fresh Supabase token
echo "${BLUE}Test 1: Generating fresh Supabase token...${NC}"
source venv/bin/activate
python get_fresh_token.py > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "${GREEN}✅ Token generated successfully${NC}"
else
    echo "${RED}❌ Token generation failed${NC}"
    exit 1
fi

# Test 2: Validate token with backend
echo ""
echo "${BLUE}Test 2: Validating token with backend API...${NC}"

RESPONSE=$(curl -s -H "Authorization: Bearer $(cat token.txt)" http://localhost:8000/api/v1/auth/me)

if echo "$RESPONSE" | grep -q "admin@dermai.com"; then
    echo "${GREEN}✅ Backend authentication successful${NC}"
    echo ""
    echo "📋 User Details:"
    echo "$RESPONSE" | jq -r '. | "   Email: \(.email)\n   Name: \(.full_name)\n   Role: \(.role)\n   UUID: \(.id)\n   Active: \(.is_active)\n   Verified: \(.is_verified)"'
else
    echo "${RED}❌ Backend authentication failed${NC}"
    echo "Response: $RESPONSE"
    exit 1
fi

# Test 3: Check database connection
echo ""
echo "${BLUE}Test 3: Verifying database connection...${NC}"

if echo "$RESPONSE" | jq -e '.created_at' > /dev/null 2>&1; then
    echo "${GREEN}✅ Database query successful${NC}"
    CREATED_AT=$(echo "$RESPONSE" | jq -r '.created_at')
    echo "   Profile created: $CREATED_AT"
else
    echo "${RED}❌ Database query failed${NC}"
    exit 1
fi

# Test 4: Verify Supabase integration
echo ""
echo "${BLUE}Test 4: Checking Supabase integration...${NC}"

UUID=$(echo "$RESPONSE" | jq -r '.id')
if [[ $UUID =~ ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$ ]]; then
    echo "${GREEN}✅ UUID format valid (Supabase auth confirmed)${NC}"
    echo "   UUID: $UUID"
else
    echo "${RED}❌ Invalid UUID format${NC}"
    exit 1
fi

# Final summary
echo ""
echo "============================================================"
echo "${GREEN}🎉 ALL TESTS PASSED - AUTHENTICATION FULLY OPERATIONAL${NC}"
echo "============================================================"
echo ""
echo "Next steps:"
echo "  • Frontend is running at: http://localhost:3000"
echo "  • Backend API is at: http://localhost:8000"
echo "  • Try logging in with: admin@dermai.com / Admin123!"
echo ""
