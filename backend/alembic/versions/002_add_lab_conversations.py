"""Add lab conversations and messages tables

Revision ID: 002_add_lab_conversations
Revises: 001_initial
Create Date: 2025-11-25 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002_add_lab_conversations'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create lab_conversations table
    op.create_table(
        'lab_conversations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('doctor_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(255), nullable=False, server_default='New Lab Analysis Chat'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('default_model', sa.String(100), nullable=True),
        sa.Column('system_prompt', sa.Text(), nullable=True),
        sa.Column('temperature', sa.Float(), nullable=False, server_default='0.7'),
        sa.Column('message_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_message_at', sa.DateTime(), nullable=True),
        sa.Column('is_pinned', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_archived', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['doctor_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_lab_conversations_doctor_id'), 'lab_conversations', ['doctor_id'], unique=False)

    # Create lab_messages table
    op.create_table(
        'lab_messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('conversation_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.Enum('USER', 'ASSISTANT', 'SYSTEM', name='messageirole'), nullable=False),
        sa.Column('message_type', sa.Enum('TEXT', 'FILE', 'ANALYSIS', 'ERROR', name='messageitype'), nullable=False, server_default='TEXT'),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('model_used', sa.String(100), nullable=True),
        sa.Column('prompt_tokens', sa.Integer(), nullable=True),
        sa.Column('completion_tokens', sa.Integer(), nullable=True),
        sa.Column('processing_time_ms', sa.Integer(), nullable=True),
        sa.Column('has_attachments', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_edited', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('edited_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['conversation_id'], ['lab_conversations.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_lab_messages_conversation_id'), 'lab_messages', ['conversation_id'], unique=False)
    op.create_index(op.f('ix_lab_messages_created_at'), 'lab_messages', ['created_at'], unique=False)

    # Create lab_message_attachments table
    op.create_table(
        'lab_message_attachments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('message_id', sa.Integer(), nullable=False),
        sa.Column('file_name', sa.String(255), nullable=False),
        sa.Column('file_path', sa.String(500), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('file_type', sa.Enum('LAB_RESULT', 'IMAGE', 'PDF', 'OTHER', name='attachmentitype'), nullable=False),
        sa.Column('mime_type', sa.String(100), nullable=True),
        sa.Column('is_processed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('extracted_data', sa.JSON(), nullable=True),
        sa.Column('ai_analysis_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['message_id'], ['lab_messages.id'], ),
        sa.ForeignKeyConstraint(['ai_analysis_id'], ['ai_analyses.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_lab_message_attachments_message_id'), 'lab_message_attachments', ['message_id'], unique=False)

    # Add columns to ai_analyses table to link to conversations and messages
    op.add_column('ai_analyses', sa.Column('conversation_id', sa.Integer(), nullable=True))
    op.add_column('ai_analyses', sa.Column('message_id', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_ai_analyses_conversation_id'), 'ai_analyses', ['conversation_id'], unique=False)
    op.create_foreign_key(None, 'ai_analyses', 'lab_conversations', ['conversation_id'], ['id'])
    op.create_foreign_key(None, 'ai_analyses', 'lab_messages', ['message_id'], ['id'])


def downgrade() -> None:
    # Drop foreign keys first
    op.drop_constraint(None, 'ai_analyses', type_='foreignkey')
    op.drop_constraint(None, 'ai_analyses', type_='foreignkey')
    op.drop_index(op.f('ix_ai_analyses_conversation_id'), table_name='ai_analyses')
    op.drop_column('ai_analyses', 'message_id')
    op.drop_column('ai_analyses', 'conversation_id')

    # Drop attachment table
    op.drop_index(op.f('ix_lab_message_attachments_message_id'), table_name='lab_message_attachments')
    op.drop_table('lab_message_attachments')

    # Drop messages table
    op.drop_index(op.f('ix_lab_messages_created_at'), table_name='lab_messages')
    op.drop_index(op.f('ix_lab_messages_conversation_id'), table_name='lab_messages')
    op.drop_table('lab_messages')

    # Drop conversations table
    op.drop_index(op.f('ix_lab_conversations_doctor_id'), table_name='lab_conversations')
    op.drop_table('lab_conversations')
