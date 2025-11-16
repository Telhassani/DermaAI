#!/usr/bin/env python3
"""Run Alembic migrations from Python code."""

import sys
from alembic.config import Config
from alembic import command

def apply_migrations():
    """Apply all pending migrations."""
    try:
        # Create Alembic config
        alembic_cfg = Config("alembic.ini")

        # Run migrations
        print("🔄 Applying Alembic migrations...")
        command.upgrade(alembic_cfg, "head")
        print("✅ All migrations applied successfully!")

        return 0
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(apply_migrations())
