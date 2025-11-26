"""Phase 3: Create new tables for enhanced functionality (doctor schedules, audit logs, lesion catalogs, lab results).

Revision ID: 006_phase3_new_tables
Revises: 005_phase3_fk_constraints
Create Date: 2025-11-16 09:40:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '006_phase3_new_tables'
down_revision = '005_phase3_fk_constraints'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create new tables for Phase 3."""
    from sqlalchemy import inspect

    inspector = inspect(op.get_context().bind)
    existing_tables = inspector.get_table_names()

    # ========================================================================
    # 1. DOCTOR_SCHEDULES TABLE - Define working hours and availability
    # ========================================================================
    if 'doctor_schedules' not in existing_tables:
        op.create_table(
            'doctor_schedules',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('doctor_id', sa.Integer(), nullable=False),
            sa.Column('day_of_week', sa.String(10), nullable=False),
            sa.Column('start_time', sa.Time(), nullable=False),
            sa.Column('end_time', sa.Time(), nullable=False),
            sa.Column('break_start', sa.Time(), nullable=True),
            sa.Column('break_end', sa.Time(), nullable=True),
            sa.Column('is_working', sa.Boolean(), nullable=False, server_default='true'),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('deleted_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['doctor_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('doctor_id', 'day_of_week', name='uq_doctor_schedules_day'),
            sa.CheckConstraint('start_time < end_time', name='ck_doctor_schedules_time'),
        )
        op.create_index('idx_doctor_schedules_doctor_id', 'doctor_schedules', ['doctor_id'])
        print("✓ Created doctor_schedules table")
    else:
        print("⚠️  doctor_schedules table already exists, skipping")

    # ========================================================================
    # 2. AUDIT_LOGS TABLE - Track all user actions (HIPAA compliance)
    # ========================================================================
    if 'audit_logs' not in existing_tables:
        op.create_table(
            'audit_logs',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('action', sa.String(50), nullable=False),
            sa.Column('table_name', sa.String(50), nullable=False),
            sa.Column('record_id', sa.Integer(), nullable=False),
            sa.Column('old_values', sa.JSON(), nullable=True),
            sa.Column('new_values', sa.JSON(), nullable=True),
            sa.Column('changes_summary', sa.Text(), nullable=True),
            sa.Column('ip_address', sa.String(50), nullable=True),
            sa.Column('user_agent', sa.Text(), nullable=True),
            sa.Column('status', sa.String(20), nullable=False, server_default='success'),
            sa.Column('error_message', sa.Text(), nullable=True),
            sa.Column('timestamp', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index('idx_audit_logs_user_id', 'audit_logs', ['user_id'])
        op.create_index('idx_audit_logs_table_record', 'audit_logs', ['table_name', 'record_id'])
        op.create_index('idx_audit_logs_timestamp', 'audit_logs', ['timestamp'])
        print("✓ Created audit_logs table")
    else:
        print("⚠️  audit_logs table already exists, skipping")

    # ========================================================================
    # 3. LESION_TYPES TABLE - Catalog of dermatological lesion types
    # ========================================================================
    if 'lesion_types' not in existing_tables:
        op.create_table(
            'lesion_types',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(100), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('category', sa.String(50), nullable=True),
            sa.Column('icd_code', sa.String(20), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('name', name='uq_lesion_types_name'),
        )
        print("✓ Created lesion_types table")
    else:
        print("⚠️  lesion_types table already exists, skipping")

    # ========================================================================
    # 4. LESION_LOCATIONS TABLE - Catalog of body parts for lesion locations
    # ========================================================================
    if 'lesion_locations' not in existing_tables:
        op.create_table(
            'lesion_locations',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(100), nullable=False),
            sa.Column('body_part', sa.String(100), nullable=True),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('name', name='uq_lesion_locations_name'),
        )
        print("✓ Created lesion_locations table")
    else:
        print("⚠️  lesion_locations table already exists, skipping")

    # ========================================================================
    # 5. LAB_RESULTS TABLE - Store laboratory analysis results
    # ========================================================================
    if 'lab_results' not in existing_tables:
        op.create_table(
            'lab_results',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('patient_id', sa.Integer(), nullable=False),
            sa.Column('consultation_id', sa.Integer(), nullable=True),
            sa.Column('doctor_id', sa.Integer(), nullable=False),
            sa.Column('test_name', sa.String(200), nullable=False),
            sa.Column('test_date', sa.Date(), nullable=False),
            sa.Column('result_value', sa.String(100), nullable=True),
            sa.Column('unit', sa.String(50), nullable=True),
            sa.Column('reference_range', sa.String(100), nullable=True),
            sa.Column('normal', sa.Boolean(), nullable=True),
            sa.Column('interpretation', sa.Text(), nullable=True),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('deleted_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['consultation_id'], ['consultations.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['doctor_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index('idx_lab_results_patient', 'lab_results', ['patient_id'])
        op.create_index('idx_lab_results_test_date', 'lab_results', [sa.desc('test_date')])
        print("✓ Created lab_results table")
    else:
        print("⚠️  lab_results table already exists, skipping")

    # ========================================================================
    # 6. PRESCRIPTION_MEDICATIONS TABLE - Normalized medication storage
    # ========================================================================
    if 'prescription_medications' not in existing_tables:
        op.create_table(
            'prescription_medications',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('prescription_id', sa.Integer(), nullable=False),
            sa.Column('medication_name', sa.String(200), nullable=False),
            sa.Column('dosage', sa.String(200), nullable=False),
            sa.Column('frequency', sa.String(100), nullable=True),
            sa.Column('duration', sa.String(100), nullable=True),
            sa.Column('quantity', sa.String(100), nullable=True),
            sa.Column('route', sa.String(50), nullable=True),
            sa.Column('instructions', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('deleted_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['prescription_id'], ['prescriptions.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index('idx_prescription_meds_prescription_id', 'prescription_medications', ['prescription_id'])
        op.create_index('idx_prescription_meds_medication_name', 'prescription_medications', ['medication_name'])
        print("✓ Created prescription_medications table")
    else:
        print("⚠️  prescription_medications table already exists, skipping")


def downgrade() -> None:
    """Remove all Phase 3 tables."""

    # Drop tables in reverse order of creation (respecting FKs)
    op.drop_index('idx_prescription_meds_medication_name', if_exists=True)
    op.drop_index('idx_prescription_meds_prescription_id', if_exists=True)
    op.drop_table('prescription_medications')

    op.drop_index('idx_lab_results_test_date', if_exists=True)
    op.drop_index('idx_lab_results_patient', if_exists=True)
    op.drop_table('lab_results')

    op.drop_table('lesion_locations')

    op.drop_table('lesion_types')

    op.drop_index('idx_audit_logs_timestamp', if_exists=True)
    op.drop_index('idx_audit_logs_table_record', if_exists=True)
    op.drop_index('idx_audit_logs_user_id', if_exists=True)
    op.drop_table('audit_logs')

    op.drop_index('idx_doctor_schedules_doctor_id', if_exists=True)
    op.drop_table('doctor_schedules')
