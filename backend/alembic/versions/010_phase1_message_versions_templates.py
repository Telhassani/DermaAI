"""Add message versions and prompt templates for Phase 1 enhancements

Revision ID: 010_phase1_message_versions_templates
Revises: 1df874a2b1e4
Create Date: 2025-12-02 00:00:00.000000

Phase 1 Features:
- Message regeneration with version history
- Prompt templates library
- Auto-generated conversation titles tracking
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '010_phase1_message_versions_templates'
down_revision = '002_add_lab_conversations'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add columns to lab_conversations for title tracking
    op.add_column(
        'lab_conversations',
        sa.Column('title_auto_generated', sa.Boolean(), nullable=False, server_default='false')
    )
    op.add_column(
        'lab_conversations',
        sa.Column('original_title', sa.String(255), nullable=True)
    )

    # Add columns to lab_messages for version tracking
    op.add_column(
        'lab_messages',
        sa.Column('current_version_number', sa.Integer(), nullable=False, server_default='1')
    )
    op.add_column(
        'lab_messages',
        sa.Column('has_versions', sa.Boolean(), nullable=False, server_default='false')
    )

    # Create lab_message_versions table for regenerated responses
    op.create_table(
        'lab_message_versions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('message_id', sa.Integer(), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('model_used', sa.String(100), nullable=True),
        sa.Column('prompt_tokens', sa.Integer(), nullable=True),
        sa.Column('completion_tokens', sa.Integer(), nullable=True),
        sa.Column('processing_time_ms', sa.Integer(), nullable=True),
        sa.Column('is_current', sa.Boolean(), nullable=False, server_default='false', index=True),
        sa.Column('regeneration_reason', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, index=True),
        sa.ForeignKeyConstraint(['message_id'], ['lab_messages.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('message_id', 'version_number', name='uq_message_version')
    )
    op.create_index(
        op.f('ix_lab_message_versions_message_id'),
        'lab_message_versions',
        ['message_id'],
        unique=False
    )

    # Create prompt_templates table
    op.create_table(
        'prompt_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('doctor_id', sa.Integer(), nullable=False),
        sa.Column('category', sa.String(100), nullable=True, index=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('template_text', sa.Text(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_system', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('usage_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true', index=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['doctor_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(
        op.f('ix_prompt_templates_doctor_id'),
        'prompt_templates',
        ['doctor_id'],
        unique=False
    )


def downgrade() -> None:
    # Drop prompt_templates table
    op.drop_index(op.f('ix_prompt_templates_doctor_id'), table_name='prompt_templates')
    op.drop_table('prompt_templates')

    # Drop lab_message_versions table
    op.drop_index(op.f('ix_lab_message_versions_message_id'), table_name='lab_message_versions')
    op.drop_table('lab_message_versions')

    # Drop columns from lab_messages
    op.drop_column('lab_messages', 'has_versions')
    op.drop_column('lab_messages', 'current_version_number')

    # Drop columns from lab_conversations
    op.drop_column('lab_conversations', 'original_title')
    op.drop_column('lab_conversations', 'title_auto_generated')
