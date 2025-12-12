#!/bin/bash
#
# Start DermAI Backend with Supabase Configuration
# This script ensures the correct DATABASE_URL is used, overriding shell environment variables
#

cd "$(dirname "$0")"

# Load environment variables from .env
export $(grep -v '^#' .env | xargs)

# FORCE the Supabase DATABASE_URL (override any shell config)
export DATABASE_URL="postgresql://postgres.scghmuaexujfhadktlho:noTjeg-wifjoc-2kyfpo@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"

echo "🔧 Starting DermAI Backend..."
echo "📊 Environment: $ENVIRONMENT"
echo "🗄️  Database: ${DATABASE_URL:0:50}..."
echo "🔐 Supabase URL: $SUPABASE_URL"
echo ""

# Activate virtual environment
source venv/bin/activate

# Start uvicorn
uvicorn app.main:app --reload --port 8000
