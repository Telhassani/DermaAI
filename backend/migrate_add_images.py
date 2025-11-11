"""
Database migration: Add images and image_annotations tables
"""

from sqlalchemy import create_engine, text
from app.core.config import settings
from app.db.session import SessionLocal
from app.models import Image, ImageAnnotation
from app.db.base import Base

def run_migration():
    """
    Create images and image_annotations tables
    """
    print("🔄 Starting migration: Add images and image_annotations tables...")

    # Create engine
    engine = create_engine(settings.DATABASE_URL)

    try:
        # Create tables
        print("📊 Creating images and image_annotations tables...")

        # Create image_type enum
        with engine.connect() as conn:
            conn.execute(text("""
                DO $$ BEGIN
                    CREATE TYPE image_type AS ENUM ('clinical', 'dermoscopic', 'histopathology', 'other');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            """))
            conn.commit()
            print("✅ Created image_type enum")

        # Create image_category enum
        with engine.connect() as conn:
            conn.execute(text("""
                DO $$ BEGIN
                    CREATE TYPE image_category AS ENUM ('diagnostic', 'follow_up', 'treatment', 'comparison');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            """))
            conn.commit()
            print("✅ Created image_category enum")

        # Create annotation_tool enum
        with engine.connect() as conn:
            conn.execute(text("""
                DO $$ BEGIN
                    CREATE TYPE annotation_tool AS ENUM ('rectangle', 'circle', 'arrow', 'pen', 'text');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            """))
            conn.commit()
            print("✅ Created annotation_tool enum")

        # Create images table
        with engine.connect() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS images (
                    id SERIAL PRIMARY KEY,
                    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
                    consultation_id INTEGER REFERENCES consultations(id) ON DELETE SET NULL,
                    file_path VARCHAR(500) NOT NULL,
                    file_name VARCHAR(255) NOT NULL,
                    file_size INTEGER NOT NULL,
                    mime_type VARCHAR(100) NOT NULL,
                    image_type image_type DEFAULT 'clinical',
                    category image_category DEFAULT 'diagnostic',
                    body_location VARCHAR(255),
                    description TEXT,
                    image_metadata JSONB,
                    thumbnail_path VARCHAR(500),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                );
            """))
            conn.commit()
            print("✅ Created images table")

        # Create indexes for images
        with engine.connect() as conn:
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_images_patient_id ON images(patient_id);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_images_consultation_id ON images(consultation_id);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at);"))
            conn.commit()
            print("✅ Created indexes for images table")

        # Create image_annotations table
        with engine.connect() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS image_annotations (
                    id SERIAL PRIMARY KEY,
                    image_id INTEGER NOT NULL REFERENCES images(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    tool annotation_tool NOT NULL,
                    coordinates JSONB NOT NULL,
                    color VARCHAR(7) DEFAULT '#FF0000',
                    label VARCHAR(255),
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                );
            """))
            conn.commit()
            print("✅ Created image_annotations table")

        # Create indexes for image_annotations
        with engine.connect() as conn:
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_annotations_image_id ON image_annotations(image_id);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_annotations_user_id ON image_annotations(user_id);"))
            conn.commit()
            print("✅ Created indexes for image_annotations table")

        print("\n✅ Migration completed successfully!")
        print("\nTables created:")
        print("  - images")
        print("  - image_annotations")
        print("\nEnums created:")
        print("  - image_type (clinical, dermoscopic, histopathology, other)")
        print("  - image_category (diagnostic, follow_up, treatment, comparison)")
        print("  - annotation_tool (rectangle, circle, arrow, pen, text)")

    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        raise
    finally:
        engine.dispose()


if __name__ == "__main__":
    run_migration()
