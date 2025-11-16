"""Phase 3: Migrate images from base64 to object storage architecture.

Revision ID: 008_phase3_image_storage_refactor
Revises: 007_phase3_soft_delete_views
Create Date: 2025-11-16 14:30:00.000000

This migration adds support for object storage (S3-compatible) while maintaining
backward compatibility with existing base64-encoded images.

Changes:
1. Add file_path column for object storage URLs
2. Add storage_type enum (base64|s3) to track storage method
3. Add upload_status to track async uploads
4. Make image_data nullable to eventually deprecate base64 storage
5. Create index on storage_type for efficient filtering
6. Create index on upload_status for tracking pending uploads

Migration Path:
- New images use S3 object storage (file_path)
- Existing base64 images remain in image_data
- Optional async migration script converts old images to S3
- Queries automatically handle both storage types
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '008_image_storage_refactor'
down_revision = '007_phase3_soft_delete_views'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add object storage support to consultation_images table."""

    # Create enum type for storage types
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE storage_type_enum AS ENUM ('base64', 's3');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    print("✓ Created storage_type_enum")

    # Create enum type for upload status
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE upload_status_enum AS ENUM ('pending', 'completed', 'failed');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    print("✓ Created upload_status_enum")

    # Check if columns already exist before adding
    from sqlalchemy import inspect
    inspector = inspect(op.get_context().bind)
    columns = [c['name'] for c in inspector.get_columns('consultation_images')]

    # Add file_path column for object storage URLs (S3-compatible)
    if 'file_path' not in columns:
        op.add_column(
            'consultation_images',
            sa.Column('file_path', sa.String(512), nullable=True)
        )
        print("✓ Added file_path column for object storage")

    # Add storage_type enum column (defaults to 'base64' for existing rows)
    if 'storage_type' not in columns:
        op.add_column(
            'consultation_images',
            sa.Column(
                'storage_type',
                postgresql.ENUM('base64', 's3', name='storage_type_enum'),
                nullable=False,
                server_default='base64'
            )
        )
        print("✓ Added storage_type column")

    # Add upload_status for async S3 uploads
    if 'upload_status' not in columns:
        op.add_column(
            'consultation_images',
            sa.Column(
                'upload_status',
                postgresql.ENUM('pending', 'completed', 'failed', name='upload_status_enum'),
                nullable=False,
                server_default='completed'
            )
        )
        print("✓ Added upload_status column")

    # Add s3_object_key for storing S3 object identifier
    if 's3_object_key' not in columns:
        op.add_column(
            'consultation_images',
            sa.Column('s3_object_key', sa.String(512), nullable=True)
        )
        print("✓ Added s3_object_key column")

    # Make image_data nullable to eventually deprecate base64
    # Note: This step maintains backward compatibility
    op.alter_column(
        'consultation_images',
        'image_data',
        existing_type=sa.String(),
        nullable=True,
        existing_nullable=False
    )
    print("✓ Made image_data nullable")

    # Create index on storage_type for efficient filtering
    try:
        op.create_index(
            'idx_images_storage_type',
            'consultation_images',
            ['storage_type'],
            if_not_exists=True
        )
        print("✓ Created index on storage_type")
    except Exception as e:
        print(f"⚠️  Index creation skipped: {e}")

    # Create index on upload_status for tracking pending uploads
    try:
        op.create_index(
            'idx_images_upload_status',
            'consultation_images',
            ['upload_status'],
            if_not_exists=True
        )
        print("✓ Created index on upload_status")
    except Exception as e:
        print(f"⚠️  Index creation skipped: {e}")

    # Create composite index for finding S3 images
    try:
        op.create_index(
            'idx_images_storage_type_upload_status',
            'consultation_images',
            ['storage_type', 'upload_status'],
            if_not_exists=True
        )
        print("✓ Created composite index on storage_type + upload_status")
    except Exception as e:
        print(f"⚠️  Composite index creation skipped: {e}")

    # Add constraint to ensure proper data: either image_data or file_path exists
    try:
        op.create_check_constraint(
            'ck_images_has_data',
            'consultation_images',
            '(image_data IS NOT NULL OR file_path IS NOT NULL)'
        )
        print("✓ Created check constraint: must have image_data or file_path")
    except Exception as e:
        print(f"⚠️  Check constraint skipped: {e}")


def downgrade() -> None:
    """Remove object storage support from consultation_images table."""

    # Drop check constraint
    try:
        op.drop_constraint('ck_images_has_data', 'consultation_images', type_='check')
    except Exception as e:
        print(f"⚠️  Dropping check constraint skipped: {e}")

    # Drop indexes
    op.drop_index('idx_images_storage_type_upload_status', if_exists=True)
    op.drop_index('idx_images_upload_status', if_exists=True)
    op.drop_index('idx_images_storage_type', if_exists=True)

    # Revert image_data to NOT NULL (will fail if any rows have NULL image_data)
    # Note: This is a dangerous operation in production
    op.alter_column(
        'consultation_images',
        'image_data',
        existing_type=sa.String(),
        nullable=False,
        existing_nullable=True
    )

    # Drop new columns
    op.drop_column('consultation_images', 's3_object_key')
    op.drop_column('consultation_images', 'upload_status')
    op.drop_column('consultation_images', 'storage_type')
    op.drop_column('consultation_images', 'file_path')

    # Drop enum types
    op.execute("DROP TYPE IF EXISTS upload_status_enum")
    op.execute("DROP TYPE IF EXISTS storage_type_enum")

    print("✓ Removed object storage support from consultation_images")
