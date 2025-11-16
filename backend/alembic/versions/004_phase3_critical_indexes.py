"""Phase 3: Add critical indexes for performance optimization.

Revision ID: 004_phase3_critical_indexes
Revises: 003_recurrence
Create Date: 2025-11-16 09:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '004_phase3_critical_indexes'
down_revision = '003_recurrence'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add critical indexes for performance optimization."""

    # === PATIENTS TABLE ===
    # Critical: doctor_id queries (get all patients for a doctor)
    op.create_index(
        'idx_patients_doctor_id',
        'patients',
        ['doctor_id'],
        if_not_exists=True
    )

    # Composite index: doctor_id + is_deleted for efficient filtering
    op.create_index(
        'idx_patients_doctor_deleted',
        'patients',
        ['doctor_id', 'is_deleted'],
        if_not_exists=True
    )

    # === CONSULTATIONS TABLE ===
    # Critical: doctor_id queries (get all consultations for a doctor)
    op.create_index(
        'idx_consultations_doctor_id',
        'consultations',
        ['doctor_id'],
        if_not_exists=True
    )

    # Follow-up queries (find patients needing follow-up)
    op.create_index(
        'idx_consultations_followup',
        'consultations',
        ['follow_up_required', 'follow_up_date'],
        if_not_exists=True
    )

    # === APPOINTMENTS TABLE ===
    # Composite index: doctor calendar queries (doctor + start_time sorted DESC)
    op.create_index(
        'idx_appointments_doctor_start',
        'appointments',
        ['doctor_id', sa.desc('start_time')],
        if_not_exists=True
    )

    # Status + time for filtering appointments by status
    op.create_index(
        'idx_appointments_status_start',
        'appointments',
        ['status', sa.desc('start_time')],
        if_not_exists=True
    )

    # Patient appointments sorted by time
    op.create_index(
        'idx_appointments_patient_start',
        'appointments',
        ['patient_id', sa.desc('start_time')],
        if_not_exists=True
    )

    # === PRESCRIPTIONS TABLE ===
    # Find expired prescriptions
    op.create_index(
        'idx_prescriptions_valid_until',
        'prescriptions',
        ['valid_until'],
        if_not_exists=True
    )

    # Find undelivered prescriptions for a patient
    op.create_index(
        'idx_prescriptions_delivery',
        'prescriptions',
        ['is_delivered', 'patient_id'],
        if_not_exists=True
    )

    # === CONSULTATION_IMAGES TABLE ===
    # Patient image gallery sorted by upload time
    op.create_index(
        'idx_images_patient_upload',
        'consultation_images',
        ['patient_id', sa.desc('uploaded_at')],
        if_not_exists=True
    )


def downgrade() -> None:
    """Remove all critical indexes."""

    # CONSULTATION_IMAGES
    op.drop_index('idx_images_patient_upload', if_exists=True)

    # PRESCRIPTIONS
    op.drop_index('idx_prescriptions_delivery', if_exists=True)
    op.drop_index('idx_prescriptions_valid_until', if_exists=True)

    # APPOINTMENTS
    op.drop_index('idx_appointments_patient_start', if_exists=True)
    op.drop_index('idx_appointments_status_start', if_exists=True)
    op.drop_index('idx_appointments_doctor_start', if_exists=True)

    # CONSULTATIONS
    op.drop_index('idx_consultations_followup', if_exists=True)
    op.drop_index('idx_consultations_doctor_id', if_exists=True)

    # PATIENTS
    op.drop_index('idx_patients_doctor_deleted', if_exists=True)
    op.drop_index('idx_patients_doctor_id', if_exists=True)
