"""merge_heads

Revision ID: 34d280a60a3f
Revises: 009_dashboard_aggregation_views, make_consultation_id_nullable
Create Date: 2025-11-22 15:06:54.360450

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '34d280a60a3f'
down_revision: Union[str, None] = ('009_dashboard_aggregation_views', 'make_consultation_id_nullable')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
