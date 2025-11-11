#!/usr/bin/env python3
"""
Migration script to add identification_type and identification_number columns to patients table
"""

from sqlalchemy import create_engine, text
from app.core.config import settings

def migrate():
    """Add identification columns to patients table"""
    engine = create_engine(settings.DATABASE_URL)

    with engine.begin() as connection:
        # Check if columns already exist
        result = connection.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name='patients' AND column_name='identification_type'
        """))

        if result.fetchone():
            print("✓ identification_type column already exists")
        else:
            print("Adding identification_type column...")
            connection.execute(text("""
                ALTER TABLE patients
                ADD COLUMN identification_type VARCHAR(20) DEFAULT 'cin'
            """))
            print("✓ Added identification_type column")

        # Check for identification_number column
        result = connection.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name='patients' AND column_name='identification_number'
        """))

        if result.fetchone():
            print("✓ identification_number column already exists")
        else:
            print("Adding identification_number column...")
            connection.execute(text("""
                ALTER TABLE patients
                ADD COLUMN identification_number VARCHAR(50) UNIQUE NOT NULL DEFAULT 'UNKNOWN'
            """))
            print("✓ Added identification_number column")

        # Create index on identification_number
        try:
            connection.execute(text("""
                CREATE INDEX idx_patients_identification_number
                ON patients(identification_number)
            """))
            print("✓ Created index on identification_number")
        except:
            print("✓ Index on identification_number already exists")

    print("\n✅ Migration completed successfully!")

if __name__ == "__main__":
    migrate()
