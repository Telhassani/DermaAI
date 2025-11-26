"""Initial schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2025-11-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Users table
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('role', sa.Enum('ADMIN', 'DOCTOR', 'SECRETARY', 'ASSISTANT', name='user_role'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('is_verified', sa.Boolean(), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('mfa_enabled', sa.Boolean(), nullable=False),
        sa.Column('mfa_secret', sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    # Patients table
    op.create_table('patients',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.Column('identification_type', sa.Enum('CIN', 'PASSPORT', name='identification_type'), nullable=False),
        sa.Column('identification_number', sa.String(length=50), nullable=False),
        sa.Column('first_name', sa.String(length=100), nullable=False),
        sa.Column('last_name', sa.String(length=100), nullable=False),
        sa.Column('date_of_birth', sa.Date(), nullable=False),
        sa.Column('gender', sa.Enum('MALE', 'FEMALE', 'OTHER', name='gender'), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=False),
        sa.Column('address', sa.String(length=255), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('postal_code', sa.String(length=20), nullable=True),
        sa.Column('country', sa.String(length=100), nullable=True),
        sa.Column('insurance_number', sa.String(length=100), nullable=True),
        sa.Column('allergies', sa.Text(), nullable=True),
        sa.Column('medical_history', sa.Text(), nullable=True),
        sa.Column('doctor_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['doctor_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_patients_email'), 'patients', ['email'], unique=False)
    op.create_index(op.f('ix_patients_first_name'), 'patients', ['first_name'], unique=False)
    op.create_index(op.f('ix_patients_id'), 'patients', ['id'], unique=False)
    op.create_index(op.f('ix_patients_identification_number'), 'patients', ['identification_number'], unique=True)
    op.create_index(op.f('ix_patients_insurance_number'), 'patients', ['insurance_number'], unique=False)
    op.create_index(op.f('ix_patients_last_name'), 'patients', ['last_name'], unique=False)

    # Consultations table
    op.create_table('consultations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('doctor_id', sa.Integer(), nullable=False),
        sa.Column('consultation_date', sa.Date(), nullable=False),
        sa.Column('consultation_time', sa.DateTime(), nullable=False),
        sa.Column('chief_complaint', sa.Text(), nullable=False),
        sa.Column('symptoms', sa.Text(), nullable=True),
        sa.Column('duration_symptoms', sa.String(length=100), nullable=True),
        sa.Column('medical_history_notes', sa.Text(), nullable=True),
        sa.Column('clinical_examination', sa.Text(), nullable=True),
        sa.Column('dermatological_examination', sa.Text(), nullable=True),
        sa.Column('lesion_type', sa.String(length=200), nullable=True),
        sa.Column('lesion_location', sa.String(length=200), nullable=True),
        sa.Column('lesion_size', sa.String(length=100), nullable=True),
        sa.Column('lesion_color', sa.String(length=100), nullable=True),
        sa.Column('lesion_texture', sa.String(length=100), nullable=True),
        sa.Column('diagnosis', sa.Text(), nullable=True),
        sa.Column('differential_diagnosis', sa.Text(), nullable=True),
        sa.Column('treatment_plan', sa.Text(), nullable=True),
        sa.Column('follow_up_required', sa.Boolean(), nullable=True),
        sa.Column('follow_up_date', sa.Date(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('private_notes', sa.Text(), nullable=True),
        sa.Column('images_taken', sa.Boolean(), nullable=True),
        sa.Column('biopsy_performed', sa.Boolean(), nullable=True),
        sa.Column('biopsy_results', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['doctor_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_consultations_consultation_date'), 'consultations', ['consultation_date'], unique=False)
    op.create_index(op.f('ix_consultations_doctor_id'), 'consultations', ['doctor_id'], unique=False)
    op.create_index(op.f('ix_consultations_id'), 'consultations', ['id'], unique=False)
    op.create_index(op.f('ix_consultations_patient_id'), 'consultations', ['patient_id'], unique=False)

    # Appointments table
    op.create_table('appointments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.Column('patient_id', sa.Integer(), nullable=True),
        sa.Column('doctor_id', sa.Integer(), nullable=False),
        sa.Column('start_time', sa.DateTime(), nullable=False),
        sa.Column('end_time', sa.DateTime(), nullable=False),
        sa.Column('type', sa.Enum('CONSULTATION', 'FOLLOW_UP', 'PROCEDURE', 'EMERGENCY', name='appointment_type'), nullable=False),
        sa.Column('status', sa.Enum('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', name='appointment_status'), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('diagnosis', sa.Text(), nullable=True),
        sa.Column('is_first_visit', sa.Boolean(), nullable=False),
        sa.Column('reminder_sent', sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(['doctor_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_appointments_doctor_id'), 'appointments', ['doctor_id'], unique=False)
    op.create_index(op.f('ix_appointments_id'), 'appointments', ['id'], unique=False)
    op.create_index(op.f('ix_appointments_patient_id'), 'appointments', ['patient_id'], unique=False)
    op.create_index(op.f('ix_appointments_start_time'), 'appointments', ['start_time'], unique=False)
    op.create_index(op.f('ix_appointments_status'), 'appointments', ['status'], unique=False)

    # Prescriptions table
    op.create_table('prescriptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.Column('consultation_id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('doctor_id', sa.Integer(), nullable=False),
        sa.Column('prescription_date', sa.Date(), nullable=False),
        sa.Column('valid_until', sa.Date(), nullable=True),
        sa.Column('medications', sa.JSON(), nullable=False),
        sa.Column('instructions', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_printed', sa.Boolean(), nullable=True),
        sa.Column('is_delivered', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['consultation_id'], ['consultations.id'], ),
        sa.ForeignKeyConstraint(['doctor_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_prescriptions_consultation_id'), 'prescriptions', ['consultation_id'], unique=False)
    op.create_index(op.f('ix_prescriptions_doctor_id'), 'prescriptions', ['doctor_id'], unique=False)
    op.create_index(op.f('ix_prescriptions_id'), 'prescriptions', ['id'], unique=False)
    op.create_index(op.f('ix_prescriptions_patient_id'), 'prescriptions', ['patient_id'], unique=False)
    op.create_index(op.f('ix_prescriptions_prescription_date'), 'prescriptions', ['prescription_date'], unique=False)

    # Consultation Images table
    op.create_table('consultation_images',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.Column('consultation_id', sa.Integer(), nullable=True),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('filename', sa.String(length=255), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('mime_type', sa.String(length=50), nullable=False),
        sa.Column('image_data', sa.String(), nullable=False),
        sa.Column('notes', sa.String(length=500), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['consultation_id'], ['consultations.id'], ),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_consultation_images_consultation_id'), 'consultation_images', ['consultation_id'], unique=False)
    op.create_index(op.f('ix_consultation_images_id'), 'consultation_images', ['id'], unique=False)
    op.create_index(op.f('ix_consultation_images_patient_id'), 'consultation_images', ['patient_id'], unique=False)
    op.create_index(op.f('ix_consultation_images_uploaded_at'), 'consultation_images', ['uploaded_at'], unique=False)


def downgrade() -> None:
    op.drop_table('consultation_images')
    op.drop_table('prescriptions')
    op.drop_table('appointments')
    op.drop_table('consultations')
    op.drop_table('patients')
    op.drop_table('users')
    
    # Drop enums
    # Note: SQLite doesn't support dropping types, but for PostgreSQL compatibility:
    # op.execute("DROP TYPE IF EXISTS user_role")
    # op.execute("DROP TYPE IF EXISTS identification_type")
    # op.execute("DROP TYPE IF EXISTS gender")
    # op.execute("DROP TYPE IF EXISTS appointment_type")
    # op.execute("DROP TYPE IF EXISTS appointment_status")
