"""Make consultation_id nullable in consultation_images table

Revision ID: make_consultation_id_nullable
Revises:
Create Date: 2025-11-17 20:15:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'make_consultation_id_nullable'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Make consultation_id nullable to support patient-centric images
    op.alter_column('consultation_images', 'consultation_id',
               existing_type=sa.Integer(),
               nullable=True)


def downgrade() -> None:
    # Make consultation_id NOT NULL again
    op.alter_column('consultation_images', 'consultation_id',
               existing_type=sa.Integer(),
               nullable=False)
