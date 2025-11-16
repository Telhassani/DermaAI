"""Add recurrence support to appointments table

Revision ID: 003_recurrence
Revises: add_control_date_prescriptions
Create Date: 2025-11-15

This migration adds support for recurring appointments and optimizes
the appointments table with additional indices and fields.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '003_recurrence'
down_revision = 'add_control_date_prescriptions'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add recurrence_rule and recurring_series_id columns to appointments table"""
    # Check if columns already exist before adding
    from sqlalchemy import inspect

    inspector = inspect(op.get_context().bind)
    columns = [c['name'] for c in inspector.get_columns('appointments')]

    # Add recurrence_rule column if not present
    if 'recurrence_rule' not in columns:
        op.add_column(
            'appointments',
            sa.Column('recurrence_rule', postgresql.JSON(), nullable=True)
        )
        print("✓ Added recurrence_rule column to appointments")

    # Add recurring_series_id column if not present
    if 'recurring_series_id' not in columns:
        op.add_column(
            'appointments',
            sa.Column('recurring_series_id', sa.Integer(), nullable=True)
        )
        print("✓ Added recurring_series_id column to appointments")

    # Create index on recurring_series_id for better query performance (if not exists)
    try:
        op.create_index(
            'ix_appointments_recurring_series_id',
            'appointments',
            ['recurring_series_id'],
            if_not_exists=True
        )
        print("✓ Created index on recurring_series_id")
    except Exception as e:
        print(f"⚠️  Index creation skipped: {e}")


def downgrade() -> None:
    """Remove recurrence columns from appointments table"""
    # Drop index
    op.drop_index('ix_appointments_recurring_series_id', table_name='appointments')
    
    # Drop columns
    op.drop_column('appointments', 'recurring_series_id')
    op.drop_column('appointments', 'recurrence_rule')
    
    print("✓ Removed recurrence support from appointments table")
