"""Add consultation_number field to consultations

Revision ID: 61ec4a5df7bd
Revises: 
Create Date: 2025-11-11 21:37:32.106553

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '61ec4a5df7bd'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add consultation_number column to consultations table
    op.add_column('consultations', sa.Column('consultation_number', sa.Integer(), nullable=True, default=0))


def downgrade() -> None:
    # Remove consultation_number column from consultations table
    op.drop_column('consultations', 'consultation_number')
