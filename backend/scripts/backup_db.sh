#!/bin/bash
#
# DermAI Database Backup Script
# Automatically backs up SQLite database with timestamp
# Keeps last 7 backups to save disk space
#

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( dirname "$( dirname "$SCRIPT_DIR" )" )"
BACKEND_DIR="$PROJECT_ROOT/backend"
BACKUP_DIR="$BACKEND_DIR/backups"
DB_FILE="$BACKEND_DIR/test.db"

# Create backups directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/test_db_backup_${TIMESTAMP}.db"

echo -e "${YELLOW}🔄 DermAI Database Backup${NC}"
echo "=================================="

# Check if database file exists
if [ ! -f "$DB_FILE" ]; then
    echo -e "${RED}❌ Error: Database file not found at $DB_FILE${NC}"
    exit 1
fi

# Perform backup
echo -e "${YELLOW}📦 Backing up database...${NC}"
cp "$DB_FILE" "$BACKUP_FILE"
echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"

# Get backup file size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo -e "${GREEN}   Size: $BACKUP_SIZE${NC}"

# Clean up old backups (keep last 7)
echo -e "${YELLOW}🧹 Cleaning up old backups (keeping last 7)...${NC}"
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/test_db_backup_*.db 2>/dev/null | wc -l)

if [ "$BACKUP_COUNT" -gt 7 ]; then
    # Remove oldest backups
    ls -t1 "$BACKUP_DIR"/test_db_backup_*.db | tail -n +8 | xargs rm -f
    echo -e "${GREEN}✅ Cleaned up old backups${NC}"
    REMAINING=$(ls -1 "$BACKUP_DIR"/test_db_backup_*.db 2>/dev/null | wc -l)
    echo -e "${GREEN}   Remaining backups: $REMAINING${NC}"
else
    echo -e "${GREEN}✅ No cleanup needed (current: $BACKUP_COUNT backups)${NC}"
fi

echo "=================================="
echo -e "${GREEN}✅ Backup complete!${NC}"
