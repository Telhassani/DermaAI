"""Make patient_id nullable in ai_analyses table for independent research mode

Revision ID: make_patient_id_nullable_in_ai_analyses
Revises: 1df874a2b1e4_add_ai_analysis_tables
Create Date: 2025-11-25 14:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'make_patient_id_nullable_in_ai_analyses'
down_revision = '1df874a2b1e4_add_ai_analysis_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Make patient_id nullable to support independent research mode
    # Doctors can now analyze lab results without linking to a patient
    with op.batch_alter_table('ai_analyses') as batch_op:
        batch_op.alter_column('patient_id',
                   existing_type=sa.Integer(),
                   nullable=True)


def downgrade() -> None:
    # Make patient_id NOT NULL again
    with op.batch_alter_table('ai_analyses') as batch_op:
        batch_op.alter_column('patient_id',
                   existing_type=sa.Integer(),
                   nullable=False)
