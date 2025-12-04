"""Phase 3: Add missing Foreign Key constraints for data integrity.

Revision ID: 005_phase3_fk_constraints
Revises: 004_phase3_critical_indexes
Create Date: 2025-11-16 09:35:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '005_phase3_fk_constraints'
down_revision = '004_phase3_critical_indexes'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add FK constraint for recurring_series_id to prevent orphaned references."""

    # Add FK constraint on recurring_series_id (self-referential)
    # If parent appointment is deleted, set recurring_series_id to NULL
    with op.batch_alter_table('appointments') as batch_op:
        batch_op.create_foreign_key(
            'fk_appointments_recurring_series',
            'appointments',
            ['recurring_series_id'],
            ['id'],
            ondelete='SET NULL'
        )


def downgrade() -> None:
    """Remove FK constraint on recurring_series_id."""

    with op.batch_alter_table('appointments') as batch_op:
        batch_op.drop_constraint(
            'fk_appointments_recurring_series',
            type_='foreignkey'
        )
