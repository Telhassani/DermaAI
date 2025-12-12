"""Add hashed_password column to profiles table

Revision ID: add_hashed_password_001
Revises: make_patient_id_nullable_in_ai_analyses
Create Date: 2025-12-12 21:10:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_hashed_password_001'
down_revision = 'make_patient_id_nullable_in_ai_analyses'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add hashed_password column to profiles table
    op.add_column('profiles', sa.Column('hashed_password', sa.String(255), nullable=True))


def downgrade() -> None:
    # Remove hashed_password column
    op.drop_column('profiles', 'hashed_password')
