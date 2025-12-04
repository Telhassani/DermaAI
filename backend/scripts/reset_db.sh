#!/bin/bash
#
# DermAI Database Reset Script
# Completely resets the SQLite database and re-initializes with sample data
# Creates a backup before resetting
#

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( dirname "$( dirname "$SCRIPT_DIR" )" )"
BACKEND_DIR="$PROJECT_ROOT/backend"
DB_FILE="$BACKEND_DIR/test.db"
BACKUP_DIR="$BACKEND_DIR/backups"

echo -e "${BLUE}🔄 DermAI Database Reset${NC}"
echo "=================================="
echo ""
echo -e "${YELLOW}⚠️  WARNING: This will delete all data in test.db!${NC}"
echo -e "${YELLOW}A backup will be created before deletion.${NC}"
echo ""
read -p "Are you sure? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${RED}❌ Reset cancelled${NC}"
    exit 1
fi

# Create backup first
echo -e "${YELLOW}📦 Creating backup before reset...${NC}"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/test_db_backup_before_reset_${TIMESTAMP}.db"

if [ -f "$DB_FILE" ]; then
    cp "$DB_FILE" "$BACKUP_FILE"
    echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"
else
    echo -e "${YELLOW}ℹ️  No existing database to backup${NC}"
fi

echo ""
echo -e "${YELLOW}🗑️  Deleting current database...${NC}"
rm -f "$DB_FILE"
echo -e "${GREEN}✅ Database deleted${NC}"

echo ""
echo -e "${YELLOW}🌱 Reinitializing database...${NC}"
cd "$BACKEND_DIR"

# Activate venv if it exists
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
fi

# Run init script
python init_db.py

echo ""
echo "=================================="
echo -e "${GREEN}✅ Database reset complete!${NC}"
echo ""
echo -e "${BLUE}Demo Credentials:${NC}"
echo "  📧 doctor@dermai.com / password123"
echo "  📧 admin@dermai.com / password123"
echo "  📧 secretary@dermai.com / password123"
echo ""
echo -e "${BLUE}Demo Patients:${NC}"
echo "  👤 Marie Dupuis"
echo "  👤 Jean Martin"
echo "  👤 Sophie Bernard"
echo ""
