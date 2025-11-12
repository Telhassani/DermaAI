"""Add control_date field to prescriptions

Revision ID: add_control_date_prescriptions
Revises: 61ec4a5df7bd
Create Date: 2025-11-12 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_control_date_prescriptions'
down_revision: Union[str, None] = '61ec4a5df7bd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add control_date column to prescriptions table
    op.add_column('prescriptions', sa.Column('control_date', sa.Date(), nullable=True))


def downgrade() -> None:
    # Remove control_date column from prescriptions table
    op.drop_column('prescriptions', 'control_date')
