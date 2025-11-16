"""Add recurrence support to appointments table

Revision ID: 003_recurrence
Revises: 61ec4a5df7bd
Create Date: 2025-11-15

This migration adds support for recurring appointments and optimizes
the appointments table with additional indices and fields.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '003_recurrence'
down_revision = '61ec4a5df7bd'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add recurrence_rule and recurring_series_id columns to appointments table"""
    # Add new columns
    op.add_column(
        'appointments',
        sa.Column('recurrence_rule', postgresql.JSON(), nullable=True)
    )
    op.add_column(
        'appointments',
        sa.Column('recurring_series_id', sa.Integer(), nullable=True)
    )
    
    # Create index on recurring_series_id for better query performance
    op.create_index(
        'ix_appointments_recurring_series_id',
        'appointments',
        ['recurring_series_id']
    )
    
    print("✓ Added recurrence_rule and recurring_series_id columns to appointments")
    print("✓ Created index on recurring_series_id")


def downgrade() -> None:
    """Remove recurrence columns from appointments table"""
    # Drop index
    op.drop_index('ix_appointments_recurring_series_id', table_name='appointments')
    
    # Drop columns
    op.drop_column('appointments', 'recurring_series_id')
    op.drop_column('appointments', 'recurrence_rule')
    
    print("✓ Removed recurrence support from appointments table")
