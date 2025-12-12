"""Migrate doctor_id to UUID in all tables to match Supabase profiles table

Revision ID: 011_migrate_doctor_id_uuid
Revises: make_patient_id_nullable_in_ai_analyses
Create Date: 2025-12-12 21:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '011_migrate_doctor_id_uuid'
down_revision = 'make_patient_id_nullable_in_ai_analyses'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Step 1: Add new UUID column to each table
    print("Adding new UUID doctor_id columns...")

    # patients table
    op.add_column('patients', sa.Column('doctor_id_new', postgresql.UUID(as_uuid=True), nullable=True))

    # appointments table
    op.add_column('appointments', sa.Column('doctor_id_new', postgresql.UUID(as_uuid=True), nullable=True))

    # consultations table
    op.add_column('consultations', sa.Column('doctor_id_new', postgresql.UUID(as_uuid=True), nullable=True))

    # prescriptions table
    op.add_column('prescriptions', sa.Column('doctor_id_new', postgresql.UUID(as_uuid=True), nullable=True))

    # ai_analyses table
    op.add_column('ai_analyses', sa.Column('doctor_id_new', postgresql.UUID(as_uuid=True), nullable=True))

    # lab_results table
    op.add_column('lab_results', sa.Column('doctor_id_new', postgresql.UUID(as_uuid=True), nullable=True))

    # ai_analysis_audit_logs table - user_id
    op.add_column('ai_analysis_audit_logs', sa.Column('user_id_new', postgresql.UUID(as_uuid=True), nullable=True))

    # Step 2: Note - In production, you would need to:
    # 1. Map existing integer doctor_id values to UUIDs (if migrating from old system)
    # 2. Since Supabase starts fresh, we're just setting up the new structure
    # For now, we leave the new columns empty and will populate on first use

    # Step 3: Drop old integer columns and rename new ones
    print("Dropping old doctor_id columns and renaming new ones...")

    # patients
    op.drop_constraint('patients_doctor_id_fkey', 'patients', type_='foreignkey')
    op.drop_column('patients', 'doctor_id')
    op.alter_column('patients', 'doctor_id_new', new_column_name='doctor_id')
    op.create_foreign_key('patients_doctor_id_fkey', 'patients', 'profiles', ['doctor_id'], ['id'])

    # appointments
    op.drop_constraint('appointments_doctor_id_fkey', 'appointments', type_='foreignkey')
    op.drop_column('appointments', 'doctor_id')
    op.alter_column('appointments', 'doctor_id_new', new_column_name='doctor_id')
    op.create_foreign_key('appointments_doctor_id_fkey', 'appointments', 'profiles', ['doctor_id'], ['id'])
    op.alter_column('appointments', 'doctor_id', existing_type=postgresql.UUID(), nullable=False)

    # consultations
    op.drop_constraint('consultations_doctor_id_fkey', 'consultations', type_='foreignkey')
    op.drop_column('consultations', 'doctor_id')
    op.alter_column('consultations', 'doctor_id_new', new_column_name='doctor_id')
    op.create_foreign_key('consultations_doctor_id_fkey', 'consultations', 'profiles', ['doctor_id'], ['id'])
    op.alter_column('consultations', 'doctor_id', existing_type=postgresql.UUID(), nullable=False)

    # prescriptions
    op.drop_constraint('prescriptions_doctor_id_fkey', 'prescriptions', type_='foreignkey')
    op.drop_column('prescriptions', 'doctor_id')
    op.alter_column('prescriptions', 'doctor_id_new', new_column_name='doctor_id')
    op.create_foreign_key('prescriptions_doctor_id_fkey', 'prescriptions', 'profiles', ['doctor_id'], ['id'])
    op.alter_column('prescriptions', 'doctor_id', existing_type=postgresql.UUID(), nullable=False)

    # ai_analyses
    op.drop_constraint('ai_analyses_doctor_id_fkey', 'ai_analyses', type_='foreignkey')
    op.drop_column('ai_analyses', 'doctor_id')
    op.alter_column('ai_analyses', 'doctor_id_new', new_column_name='doctor_id')
    op.create_foreign_key('ai_analyses_doctor_id_fkey', 'ai_analyses', 'profiles', ['doctor_id'], ['id'])
    op.alter_column('ai_analyses', 'doctor_id', existing_type=postgresql.UUID(), nullable=False)

    # lab_results
    op.drop_constraint('lab_results_doctor_id_fkey', 'lab_results', type_='foreignkey')
    op.drop_column('lab_results', 'doctor_id')
    op.alter_column('lab_results', 'doctor_id_new', new_column_name='doctor_id')
    op.create_foreign_key('lab_results_doctor_id_fkey', 'lab_results', 'profiles', ['doctor_id'], ['id'])
    op.alter_column('lab_results', 'doctor_id', existing_type=postgresql.UUID(), nullable=False)

    # ai_analysis_audit_logs - user_id
    op.drop_constraint('ai_analysis_audit_logs_user_id_fkey', 'ai_analysis_audit_logs', type_='foreignkey')
    op.drop_column('ai_analysis_audit_logs', 'user_id')
    op.alter_column('ai_analysis_audit_logs', 'user_id_new', new_column_name='user_id')
    op.create_foreign_key('ai_analysis_audit_logs_user_id_fkey', 'ai_analysis_audit_logs', 'profiles', ['user_id'], ['id'])
    op.alter_column('ai_analysis_audit_logs', 'user_id', existing_type=postgresql.UUID(), nullable=False)

    # Step 4: Recreate indexes
    print("Recreating indexes...")
    op.create_index(op.f('ix_patients_doctor_id'), 'patients', ['doctor_id'], unique=False)
    op.create_index(op.f('ix_appointments_doctor_id'), 'appointments', ['doctor_id'], unique=False)
    op.create_index(op.f('ix_consultations_doctor_id'), 'consultations', ['doctor_id'], unique=False)
    op.create_index(op.f('ix_prescriptions_doctor_id'), 'prescriptions', ['doctor_id'], unique=False)
    op.create_index(op.f('ix_ai_analyses_doctor_id'), 'ai_analyses', ['doctor_id'], unique=False)
    op.create_index(op.f('ix_lab_results_doctor_id'), 'lab_results', ['doctor_id'], unique=False)


def downgrade() -> None:
    # Step 1: Add old integer columns back
    print("Rolling back to integer doctor_id columns...")

    # Remove new UUID columns and add back integers
    op.drop_constraint('patients_doctor_id_fkey', 'patients', type_='foreignkey')
    op.drop_column('patients', 'doctor_id')
    op.add_column('patients', sa.Column('doctor_id', sa.Integer(), nullable=True))

    op.drop_constraint('appointments_doctor_id_fkey', 'appointments', type_='foreignkey')
    op.drop_column('appointments', 'doctor_id')
    op.add_column('appointments', sa.Column('doctor_id', sa.Integer(), nullable=False))

    op.drop_constraint('consultations_doctor_id_fkey', 'consultations', type_='foreignkey')
    op.drop_column('consultations', 'doctor_id')
    op.add_column('consultations', sa.Column('doctor_id', sa.Integer(), nullable=False))

    op.drop_constraint('prescriptions_doctor_id_fkey', 'prescriptions', type_='foreignkey')
    op.drop_column('prescriptions', 'doctor_id')
    op.add_column('prescriptions', sa.Column('doctor_id', sa.Integer(), nullable=False))

    op.drop_constraint('ai_analyses_doctor_id_fkey', 'ai_analyses', type_='foreignkey')
    op.drop_column('ai_analyses', 'doctor_id')
    op.add_column('ai_analyses', sa.Column('doctor_id', sa.Integer(), nullable=False))

    op.drop_constraint('lab_results_doctor_id_fkey', 'lab_results', type_='foreignkey')
    op.drop_column('lab_results', 'doctor_id')
    op.add_column('lab_results', sa.Column('doctor_id', sa.Integer(), nullable=False))

    op.drop_constraint('ai_analysis_audit_logs_user_id_fkey', 'ai_analysis_audit_logs', type_='foreignkey')
    op.drop_column('ai_analysis_audit_logs', 'user_id')
    op.add_column('ai_analysis_audit_logs', sa.Column('user_id', sa.Integer(), nullable=False))

    # Recreate old indexes
    op.create_index(op.f('ix_patients_doctor_id'), 'patients', ['doctor_id'], unique=False)
    op.create_index(op.f('ix_appointments_doctor_id'), 'appointments', ['doctor_id'], unique=False)
    op.create_index(op.f('ix_consultations_doctor_id'), 'consultations', ['doctor_id'], unique=False)
    op.create_index(op.f('ix_prescriptions_doctor_id'), 'prescriptions', ['doctor_id'], unique=False)
    op.create_index(op.f('ix_ai_analyses_doctor_id'), 'ai_analyses', ['doctor_id'], unique=False)
    op.create_index(op.f('ix_lab_results_doctor_id'), 'lab_results', ['doctor_id'], unique=False)
